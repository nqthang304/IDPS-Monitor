# 1. PROJECT TECHNOLOGIES - INSTALLED LIBS

## 

```
mkdir sysnetdef_server && cd sysnetdef_server
npm init -y
npm install express socket.io drizzle-orm better-sqlite3 dotenv
npm install -D typescript @types/node @types/express @types/better-sqlite3 ts-node-dev drizzle-kit
npm install cli-table3
npm install bcrypt jsonwebtoken
npm install -D @types/bcrypt @types/jsonwebtoken
npm install --save-dev @types/nodemailer @types/ejs
npm install --save-dev @types/date-fns
npm install date-fns
npm install nodemailer
npm install --save-dev @types/nodemailer
npm install ejs
npm install --save-dev @types/ejs
npm install cors
npm install @types/cors -D
npm install colorette
npx tsc --init
npm install -D tsc-alias
```

# 2. PROJECT LAYERS :

## PART 1 - HTTP
```
1. ROUTES (Linked functions to endpoints - attached middleware)
   -
2. CONTROLLER (The decision of the summation function directly corresponds to the endpoints, controlling the cases and return values.)
   -
3. REQUEST.SERVICE (This area handles the main logic from the client request, directly processing short requests (without loading commands into the main program))
   -
4. MAINC.BRIDGE (This layer acts as a synchronous thread within the system, responsible for loading client requests onto the mainboard)
   -
5. MAINC.DRIVER (This layer is the one that directly handles the communication process with the mainboard.)
   -
6. HANDLER.SERVICE (This layer is responsible for processing the feedback data from the mainc to update the system configuration before responding to the frontend.)
   -
7. NOTIFICATION (This layer is directly responsible for classifying and sending the mainc's feedback information to the frontend via the websocket protocol.)
```
```
```

## PART 2 - WS
```
1. STREAM (This layer is directly responsible for forwarding data from the dashboard pages to the frontend.)
```

## PART 3 - DATABASE
```
1. SCHEMA (This layer defines the structure of the tables in the database and their relationships.)
   -
2. SEED (This layer specifies the sample data from previous tables, which is loaded during system initialization in case of missing databases or tables.)
   -
3. REPOSITORY (This layer defines functions that directly query data from the tables, allowing other threads to communicate with the database.)
```

# 3. DEV ONLY FEATURES
```
LOGGER (This layer pushes source code logs to the console in development/production environments, helping programmers monitor system processes and debug.)
```

# 4. BUILD INSTRUCTION
```
execute file build.bat -> replace dist dir to production src -> run "pm2 restart 0"
```