
jar -cMf ..\index.zip *
aws lambda update-function-code --function-name alexabustracker --zip-file fileb://..\index.zip
del ..\index.zip
