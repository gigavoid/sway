## gigavoid/sway

    docker run --name sway -p 15002:3000 -d --link gv-mongo:mongo
     -e "mongo=mongodb://mongo/gigavoid-sway" -e "sway_host=sway.gigavoid.com"
      -v /var/run/docker.sock:/var/run/docker.sock gigavoid/sway
  
## gigavoid/accounts-api
    
    docker run --name gv-accounts-api -p 15001:3000 -d --link gv-mongo:mongo
      -e "mongo=mongodb://mongo/gigavoid-accounts" gigavoid/accounts-api
  
## gigavoid/accounts
  
    docker run --name gv-accounts -p 15000:80 -d gigavoid/accounts

## gigavoid/accounts-api
  
    docker run --name gv-accounts-api -p 15001:3000 -d --link gv-mongo:mongo
      -e "mongo=mongodb://mongo/gigavoid-accounts" gigavoid/accounts-api
