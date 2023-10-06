FROM earnest/flyway8:1.2.0-8df4cdb

WORKDIR /usr/src/app

ADD sql/ /usr/src/app/schema/sql/
ADD entrypoint.sh /usr/src/entrypoint.sh

ENTRYPOINT ["/usr/src/entrypoint.sh"]

CMD ["migrate"]
