"use strict";

var express         = require('express');
var bodyParser      = require('body-parser');
var router 	        = express.Router();
var morgan          = require('morgan');
var passport        = require('passport');
var jwt             = require('jsonwebtoken');
var expressJwt      = require('express-jwt');
var app             = express();
var express         = require('express');
var app             = express();
var server          = require('http').Server(app);
var helmet          = require('helmet');
/*
 var lusca           = require('lusca');
*/

//============================================

module.exports = function (config, logger, fp) {
    //==============================================
    // SERVER

    server.listen(config.api.port, function(err, res){
      //TODO CATCH ERRORS:
      logger.log('info','Listening on port '+config.api.port);
    });


    app.use(bodyParser.urlencoded({extended: true}));
    app.use(bodyParser.json({limit: config.api.limite_req}));

    //==============================================
    // SECURITY
    app.use(helmet());
    app.disable('x-powered-by');
/*
    app.use(lusca({
      csp: {},
      xframe: 'SAMEORIGIN',
      hsts: {maxAge: 31536000, includeSubDomains: true, preload: true},
      xssProtection: true
    }));
*/
    /*
     app.use(function(req, res, next) {
     if (config.CSRF_EXCLUDE.indexOf(req.path) === -1) {
     lusca.csrf({angular:true})(req, res, next);
     } else {
     next();
     }
     });
     */

    //JSON Vulnerability Protection (Angular):
    /*
    app.use(function (req, res, next){

      var actualSend = res.send;
      res.send = function (data) {

        var excludeJSONProtect = false;
        for (var i = 0; i < config.global.excludeJSONProtectURLs.length; i++) {
          if (req.originalUrl.indexOf(config.global.excludeJSONProtectURLs[i]) !== -1)
          {
            excludeJSONProtect = true;
          }
        };

        if (typeof data === "object" && !excludeJSONProtect) {
          var strData = ")]}',\n" + JSON.stringify(data);
          res.set('Content-Type', 'text/json');
          actualSend.call (res, strData);
        } else {
          actualSend.call (res, data);
        }
      };
      next();
    });
    */
/*
    app.use(function (req, res, next) {

      // Website you wish to allow to connect
      res.setHeader('Access-Control-Allow-Origin', 'https://localhost:3030');

      // Request methods you wish to allow
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

      // Request headers you wish to allow
      res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

      // Set to true if you need the website to include cookies in the requests sent
      // to the API (e.g. in case you use sessions)
      res.setHeader('Access-Control-Allow-Credentials', true);

      // Pass to next layer of middleware
      next();
    });
*/
    //==================================================================
    // API

    app.use(morgan('dev'));

    app.use(bodyParser.json());

    app.use(expressJwt({
      secret: config.api.secret,
      getToken: function fromHeaderOrQuerystring (req) {
        if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
          return req.headers.authorization.split(' ')[1];
        } else if (req.query && req.query.token) {
          return req.query.token;
        }
        return null;
      }
    }).unless({
      path: ['/auth']
    }));

    app.use(function (err, req, res, next) {
      if (err.name === 'UnauthorizedError') {
        res.status(401).send('Unauthorized');
      }
    });

    app.use('/', router);

    router.post('/auth', function(req, res) {

      var user 	   = req.body.user;
      var password = req.body.password;
      console.log('user:',user,'password:',password,req.body);

      if (!user) {
        res.json({ success: false, message: 'Authentication failed. User not found.' });
      } else if (user) {
        console.log('user:',user,'password:',password);
        if(user === 'coderty' && password === 'runnerty'){

          var token = jwt.sign(user, config.api.secret, {
           // expiresIn: "10h" // 8 hours
          });

          res.json({
            success: true,
            message: 'Run your token!',
            token: token
          });

        }else{
          res.json({ success: false, message: 'Authentication failed.' });
        }
      }
    });


    function locateIdPosition(items, id){
      var itemsLength = items.length;
      var posLocation = -1;
      while(itemsLength--){
        if(items[itemsLength].id === id){
          posLocation = itemsLength;
          itemsLength = 0;
        }
      }
      return posLocation;
    }

    // GET ALL CHAINS
    router.get('/chains', function (req, res) {
      res.json(fp.plan.chains);
    });

    // GET A CHAIN
    router.get('/chain/:chainId', function (req, res) {
      var chainId = req.params.chainId;

      var chain = fp.plan.chains[locateIdPosition(fp.plan.chains,chainId)];

      if(chain){
        res.json(chain);
      }else{
        res.status(404).send(`Chain "${chainId}" not found`);
      }

    });

    //GET ALL PROCESSES OF CHAIN INDICATED IN PARAMETER chainId
    router.get('/processes/:chainId', function (req, res) {
      var chainId = req.params.chainId;
      var processes;

      processes = fp.plan.chains[locateIdPosition(fp.plan.chains,chainId)].processes;

      if(processes){
        res.json(processes);
      }else{
        res.status(404).send(`Chain "${chainId}" not found`);
      }

    });

    //GET A PROCESS OF CHAIN INDICATED IN PARAMETER chainId AND processId
    router.get('/process/:chainId/:processId', function (req, res) {
      var chainId = req.params.chainId;
      var processId = req.params.processId;

      var chainPos = locateIdPosition(fp.plan.chains,chainId);
      var processPos = locateIdPosition(fp.plan.chains[chainPos].processes,processId);

      var process = fp.plan.chains[chainPos].processes[processPos];

      if(process){
        res.json(process);
      }else{
        res.status(404).send(`Process "${processId}" of chain "${chainId}" not found`);
      }

    });

    // RETRY A PROCESS OF A CHAIN INDICATE: chainId, processId AND once (TRUE FOR ONCE RETRY FALSE FOR CONFIGURED RETRIES)
    router.post('/process/retry', function (req, res) {

      var chainId   = req.body.chainId;
      var processId = req.body.processId;
      var once      = req.body.once || false;

      var chainPos = locateIdPosition(fp.plan.chains,chainId);
      var processPos = locateIdPosition(fp.plan.chains[chainPos].processes,processId);

      logger.log('info',`Retrying process "${processId}" of chain "${chainId}" by ${req.user}`);

      if(fp.plan.chains[chainPos].processes[processPos].status === 'error'){
        res.json();

        fp.plan.chains[chainPos].processes[processPos].start(true, once)
          .then(function(res) {
          })
          .catch(function(e){
            logger.log('error','Retrying process:'+e)
          });
      }else{
        res.status(423).send(`Process "${processId}" of chain "${chainId}" is not in errored status`);
      }

    });

    // SET END A PROCESS OF A CHAIN INDICATE: chainId, processId
    router.post('/process/end', function (req, res) {
      var chainId   = req.body.chainId;
      var processId = req.body.processId;
      var continueChain = req.body.continueChain || false;

      var chainPos = locateIdPosition(fp.plan.chains,chainId);
      var processPos = locateIdPosition(fp.plan.chains[chainPos].processes,processId);
      logger.log('info',`Set end process "${processId}" of chain "${chainId}" by ${req.user}`);

      if(!fp.plan.chains[chainPos].processes[processPos].isEnded() && !fp.plan.chains[chainPos].processes[processPos].isRunning()){

        res.json();

        fp.plan.chains[chainPos].processes[processPos].execute_return = '';
        fp.plan.chains[chainPos].processes[processPos].execute_err_return = '';
        fp.plan.chains[chainPos].processes[processPos].end();

        if(continueChain){
          fp.plan.chains[chainPos].startProcesses()
            .then(function(res){
            })
            .catch(function(e){
              logger.log('error',`Error in startProcesses next to set end process "${processId}" of chain "${chainId}"  by ${req.user}:`+e);
            })
        }

      }else{
        res.status(423).send(`Is not posible set process "${processId}" of chain "${chainId}" to end because is ${fp.plan.chains[chainPos].processes[processPos].status}`);
      }

    });

    // LOAD NEW CHAIN
    router.post('/chain/load', function (req, res) {

      var chainId   = req.body.chainId;
      var planFile  = req.body.planFile || config.planFilePath;
      var forceLoad = req.body.forceLoad || false;

      fp.loadFileContent(planFile)
        .then((fileRes) => {
          fp.getChains(fileRes)
          .then((chains) => {
            var cp = locateIdPosition(chains,chainId);
            if(cp === -1){
              res.status(404).send(`Chain "${chainId}" not found in file`);
            }else{
              var chain = chains[cp];
              fp.plan.loadChain(chain)
                .then(function(chainObj){
                  fp.plan.chains.push(chainObj);
                  var cp = locateIdPosition(fp.plan.chains,chainId);
                  if(cp === -1){
                    res.status(404).send(`Chain "${chainId}" not found in plan`);
                  }else{
                    res.json();
                    fp.plan.planificateChain(fp.plan.chains[cp]);
                    fp.refreshBinBackup();
                  }
                })
                .catch(function(err){
                  res.status(500).send(`Error loading "${chainId}" (creating plan):`+err);
                  logger.log('error','FilePlan new Plan: '+err);
                })
            }
          })
          .catch(function(err){
            res.status(500).send(`Error loading "${chainId}" (loading chain):`+err);
            logger.log('error','FilePlan loadFileContent getChains: '+err);
          });
        })
        .catch(function(e){
          res.status(500).send(`Error loading "${chainId}" (loading file):`+err);
          logger.log('error','File Plan, constructor:'+e)
        });
    });

  // RELOAD CHAIN
  router.post('/chain/reload', function (req, res) {

    var chainId   = req.body.chainId;
    var planFile  = req.body.planFile || config.planFilePath;

    var posChain = locateIdPosition(fp.plan.chains,chainId);
    if(posChain === -1){
      res.status(404).send(`Chain "${chainId}" not found`);
    }else{
      var chain = fp.plan.chains[posChain];

      if(chain.isRunning()){
        res.status(423).send(`Is not posible reload chain "${chainId}" because is ${chain.status}`);
      }else{
        fp.loadFileContent(planFile)
          .then((fileRes) => {
          fp.getChains(fileRes)
          .then((chains) => {
          var cp = locateIdPosition(chains,chainId);
          if(cp === -1){
            res.status(404).send(`Chain "${chainId}" not found in file`);
          }else{
            var chain = chains[cp];
            fp.plan.loadChain(chain)
              .then(function(chainObj){

                res.json();
                fp.plan.chains[posChain] = chainObj;
                fp.plan.planificateChain(fp.plan.chains[posChain]);
                fp.refreshBinBackup();

              })
              .catch(function(err){
                res.status(500).send(`Error reloading "${chainId}" (creating plan):`+err);
                logger.log('error','FilePlan new Plan: '+err);
              })
          }
          })
          .catch(function(err){
              res.status(500).send(`Error reloading "${chainId}" (loading chain):`+err);
              logger.log('error','FilePlan loadFileContent getChains: '+err);
            });
          })
          .catch(function(e){
              res.status(500).send(`Error reloading "${chainId}" (loading file):`+err);
              logger.log('error','File Plan, constructor:'+e)
            });
          }
          }
        });

    //TODO RELOAD PROCESS OF CHAIN

};