#!/usr/bin/env groovy
def DeployEnv = library('jenkins-pipeline-library').com.earnest.jpl.DeploymentEnvironment
def Strength = library('jenkins-pipeline-library').com.earnest.jpl.AccomplishmentStrength

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
  }
}
