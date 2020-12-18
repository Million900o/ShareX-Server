# ShareX-Server

## About

This is a ShareX server that I made.
  
---

## Requirements to run

- MonoDB properly configured

- Domain name or IP pointing to the server

- ShareX or a similar application

---

## Setup

1. Clone the git repo.

2. cd to src directory

3. Create and setup the config.json file.

4. Use a process manager such as pm2 to run the server 24/7.

---

### Example config.json

```json
{
  "passwordSaltRounds": 13,
  "connectURI": "mongodb://localhost/sharex",  
  "subdomain": "example",
  "domain": "example.com",  
  "secure": true,
  "debug": false,
  "mongo": {
    "connectURI": "mongodb://localhost/sharex",
    "connectOptions": {}
  },
  "port": 80
}
```

### Contributors

- [Roki](https://github.com/Roki100)
