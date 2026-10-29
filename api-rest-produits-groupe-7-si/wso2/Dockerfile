FROM maven:3.9-eclipse-temurin-21 AS build

ARG WSO2_KEYSTORE_PASSWORD
ENV WSO2_KEYSTORE_PASSWORD=${WSO2_KEYSTORE_PASSWORD}

WORKDIR /workspace
COPY . .

RUN test -n "$WSO2_KEYSTORE_PASSWORD" \
    && mvn -B package -Dmaven.test.skip=true

FROM wso2/wso2mi:4.6.0

COPY --from=build /workspace/target/*.car ${WSO2_SERVER_HOME}/repository/deployment/server/carbonapps/
COPY --from=build /workspace/deployment/libs/*.jar ${WSO2_SERVER_HOME}/lib/
