FROM earnest/node18:1.5-161777b

WORKDIR /usr/src/app

RUN npm install -g uuid@7.0.3 supervisor@0.12.0 mountebank@2.7.0 node-fetch@2.6.0 aws-sdk@2.1231.0

ADD docker/dev/start /usr/bin/start
ADD docker/dev/entrypoint /usr/bin/entrypoint

ENTRYPOINT ["/usr/bin/entrypoint"]
CMD ["/usr/bin/start"]

EXPOSE 3000
