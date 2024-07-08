#!/usr/bin/env groovy
def DeployEnv = library('jenkins-pipeline-library').com.earnest.jpl.DeploymentEnvironment
def Strength = library('jenkins-pipeline-library').com.earnest.jpl.AccomplishmentStrength

def updateAndValidateContracts() {
  withCredentials([
    string(credentialsId: 'PACT_BROKER_URL', variable: 'PACT_BROKER_URL'),
    string(credentialsId: 'PACT_BROKER_TOKEN', variable: 'PACT_BROKER_TOKEN'),
    string(credentialsId: 'AFS_BEARER_TOKEN', variable: 'AFS_BEARER_TOKEN')
  ]) {
    env.TRACESTATE = env.SIGNADOT_ROUTING_KEY
    sh "./scripts/pact.sh"
  }
}

pipeline {
  agent none

  options {
    ansiColor colorMapName: 'XTerm'
  }

  environment {
    SERVICE_NAME = 'apply-flow-service'
    SLACK_CHANNEL = 'lending-application-notifications'
  }

  stages {
    stage('Set version') {
      agent {
        label 'generic'
      }
      steps {
        printEnvSorted()
        script {
          env.VERSION = versionFromPackageJson()
          env.ARTIFACT_VERSION = "${env.VERSION}-${env.BUILD_ID}-${env.GIT_COMMIT}"
          env.DOCKER_IMAGE_VERSION = "earnest/${env.SERVICE_NAME}:${env.VERSION}"
          currentBuild.description = "Artifact version: ${env.ARTIFACT_VERSION}"
        }
      }
    }

    stage('Run all unit and contract tests') {
      parallel{
        stage('Unit Test & code coverage') {
          agent {
            label 'generic'
          }
          environment {
            SERVICE_NAME = 'apply-flow-service'
            scannerTool = tool name: 'SonarCloud', type: 'hudson.plugins.sonar.SonarRunnerInstallation'
            SONAR_CLOUD_TOKEN = credentials('SONAR_CLOUD_TOKEN')
            SCANNER_HOME = '/var/lib/jenkins/tools/hudson.plugins.sonar.SonarRunnerInstallation/SonarCloud'
          }
          tools {
            nodejs 'NodeJS-16'
          }
          steps {
            printEnvSorted()
            prepareDockerEnv(true)
            prepareNpmEnv()
            sh "docker-compose build --quiet ci"
            sh "docker-compose run --quiet-pull ci npx chassis-lint"
            script {
              try {
                sh "docker-compose run --quiet-pull ci npx chassis-test"
              } finally {
                uploadCodeMetricsToSonarCloud(env.GIT_BRANCH != "main")
              }
            }
          }

          post {
            success {
              createSplunkHttpEvent([serviceName: env.SERVICE_NAME, stepName: "ci-test", templateName: "microservice-chassis", result: "success"], [], env.SERVICE_NAME, versionFromPackageJson(), "service-template-event")
            }
            failure {
              createSplunkHttpEvent([serviceName: env.SERVICE_NAME, stepName: "ci-test", templateName: "microservice-chassis", result: "failure"], [], env.SERVICE_NAME, versionFromPackageJson(), "service-template-event")
            }
            cleanup {
              cleanAll()
            }
          }
        }

        stage("PACT Contract tests") {
          stages {
            stage('Bypass this stage?') {
              agent {
                label 'generic'
              }
              when {
                expression {
                  return !hasChangesIn('schema/sql') && (env.BRANCH_NAME != 'main')
                }
              }
              steps {
                script {
                  try {
                    timeout(time: 30, unit: 'SECONDS') {
                      env.BYPASS = input(
                        message: 'Bypass this stage?',
                        parameters: [
                          choice(name: 'Bypass this stage', choices: 'Yes\nNo', description: 'Bypass signadot/contract tests steps'),
                        ],
                      )
                    }
                  } catch (e) {
                    env.BYPASS = 'No'
                  }
                }
              }
            }
            stage("Build and push docker image for signadot") {
              agent {
                label 'generic'
              }
              when {
                expression {
                  return (env.BYPASS != 'Yes') && !hasChangesIn('schema/sql') && (env.BRANCH_NAME != 'main')
                }
              }
              steps {
                printEnvSorted()
                prepareDockerEnv()
                prepareNpmEnv()
                sh "docker-compose build prod"
                dockerPushBranch(env.DOCKER_IMAGE_VERSION)
              }
              post {
                always {
                  cleanAll()
                }
              }
            }
            stage("Deploy to sandbox") {
              agent {
                label 'generic'
              }
              when {
                expression {
                  return (env.BYPASS != 'Yes') && !hasChangesIn('schema/sql') && (env.BRANCH_NAME != 'main')
                }
              }
              steps {
                printEnvSorted()
                prepareDockerEnv(true)
                sandboxDeploy(env.SERVICE_NAME)
              }
            }
            stage("Update & validate contracts (in PR)") {
              agent {
                label 'generic'
              }
              when {
                expression {
                  return (env.BYPASS != 'Yes') && (env.BRANCH_NAME != 'main')
                }
              }
              steps {
                prepareDockerEnv()
                prepareNpmEnv()
                updateAndValidateContracts()
              }
              post {
                cleanup {
                  cleanAll()
                }
              }
            }
          }
        }
      } 
    }

    stage("Build Docker Images"){
      parallel {
        stage("Build service") {
          agent {
            label 'generic'
          }
          when {
            expression {
              return (isValidPBEEnvironment(env.SELECTED_PBE_ENVIRONMENT) || env.GIT_BRANCH == 'main');
            }
          }
          steps {
            prepareDockerEnv()
            prepareNpmEnv()
            prepareGogoEnv()
            sh "docker-compose build --progress=plain --build-arg VERSION prod"
            dockerPush("earnest/apply-flow-service:${env.VERSION}")
          }
          post {
            cleanup {
              cleanAll()
            }
          }
        }
      }
    }

    stage("Deploy to Staging") {
      agent {
        label 'generic'
      }
      when {
        beforeAgent true
        branch "main"
      }
      steps {
        prepareDockerEnv()
        accomplishment(env.SERVICE_NAME, 'deploy_staging', Strength.Weaker) {
          deployTo(DeployEnv.Staging, "${env.VERSION}", env.SERVICE_NAME)
        }
      }
      post {
        success {
          createSplunkHttpEvent([serviceName: env.SERVICE_NAME, stepName: "ci-staging-deployment", templateName: "microservice-chassis", result: "success"], [], env.SERVICE_NAME, versionFromPackageJson(), "service-template-event")
        }
        failure {
          createSplunkHttpEvent([serviceName: env.SERVICE_NAME, stepName: "ci-staging-deployment", templateName: "microservice-chassis", result: "failure"], [], env.SERVICE_NAME, versionFromPackageJson(), "service-template-event")
          slackSendOnBranch(
            'main',
            "#${env.SLACK_CHANNEL}",
            'danger',
            "[apply-flow-service]: Pipeline stage 'Deploy to Staging' failed! (<${env.BUILD_URL}|Details>)"
          )
        }
        cleanup {
          cleanAll()
        }
      }
    }

    stage("Promote to Production") {
      agent none
      when {
        beforeAgent true
        branch "main"
      }
      steps {
        slackSendOnBranch(
          'main',
          "#${env.SLACK_CHANNEL}",
          'good',
          "[apply-flow-service]: <${env.BUILD_URL}|Build #${env.BUILD_ID}> is promotable!"
        )
        promoteButton(env.SERVICE_NAME, 'production', Strength.Normal)
      }
    }

    stage("Canonize Docker Images"){
      parallel {
        stage("Canonize service") {
          agent {
            label 'generic'
          }
          when {
            beforeAgent true
            branch "main"
          }
          steps {
            prepareDockerEnv()
            prepareNpmEnv()
            sh "docker pull earnest/apply-flow-service:${env.VERSION}"
            withEnv(["VERSION=latest"]) {
              sh "docker-compose build --build-arg VERSION prod"
              dockerPush("earnest/apply-flow-service:${env.VERSION}")
            }
          }
          post {
            cleanup {
              cleanAll()
            }
            failure {
              slackSendOnBranch(
                'main',
                "#${env.SLACK_CHANNEL}",
                'danger',
                "[apply-flow-service]: pipeline stage 'Canonize service' failed! (<${env.BUILD_URL}|Details>)"
              )
            }
          }
        }
      }
    }

    stage("Deploy to production") {
      agent {
        label 'generic'
      }
      when {
        beforeAgent true
        branch "main"
      }
      steps {
        prepareDockerEnv()
        accomplishment(env.SERVICE_NAME, 'deploy_production', Strength.Stronger) {
          deployTo(DeployEnv.Production, "${env.VERSION}", env.SERVICE_NAME)
        }
      }
      post {
        success {
          createSplunkHttpEvent([serviceName: env.SERVICE_NAME, stepName: "ci-production-deployment", templateName: "microservice-chassis", result: "success"], [], env.SERVICE_NAME, versionFromPackageJson(), "service-template-event")
          slackSendOnBranch(
            'main',
            "#${env.SLACK_CHANNEL}",
            'good',
            "[apply-flow-service]: earnest/apply-flow-service:${env.VERSION} successfully deployed to production :confetti_ball: (<${env.BUILD_URL}|Details>)"
          )
        }
        failure {
          createSplunkHttpEvent([serviceName: env.SERVICE_NAME, stepName: "ci-production-deployment", templateName: "microservice-chassis", result: "failure"], [], env.SERVICE_NAME, versionFromPackageJson(), "service-template-event")
          slackSendOnBranch(
            'main',
            "#${env.SLACK_CHANNEL}",
            'danger',
            "[apply-flow-service]: pipeline stage 'Deploy to production' failed! (<${env.BUILD_URL}|Details>)"
          )
        }
        cleanup {
          cleanAll()
        }
      }
    }
  }
}
