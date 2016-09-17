{
  "chains":[{
  "id":"CHAIN_UNO",
  "name":"Actualizacion de stock via Magmi",
  "start_date":"2016-08-01T00:00:00",
  "end_date":"2099-11-01T00:00:00",
  "schedule_interval":"*/1 * * * *",
  "depends_chains":[],
  "events":{"on_start":{},"on_end":{}, "on_waiting_dependencies":{}, "on_exceeded_limited_time_end":{}},
  "processes":[{
    "id":"PROC_LAUNCHER",
    "name":"Concatenador de CSVs",
    "depends_process":[],
    "exec":{"command":"SELECT * FROM test", "type":"postgre", "db_connection_id":"postgres_default"},
    "args": {"idg":"3", "pop":":PROCESS_ID"},
    "retries":0,
    "retry_delay":0,
    "end_chain_on_fail":true,
    "output":[{"file_name":"/etc/runnerty/test.log", "write":["[!] EJECUCIÓN :DD-:MM-:YY :HH::mm::ss -","PROCESS_EXEC_DB_RESULTS\n :PROCESS_EXEC_DB_RESULTS","PROCESS_EXEC_DB_AFFECTEDROWS:\n :PROCESS_EXEC_DB_AFFECTEDROWS"], "concat":true, "maxsize":"1mb"},
      {"file_name":"/etc/runnerty/RES_MYSQL.log", "write":[":PROCESS_EXEC_DB_RESULTS"], "concat":false, "maxsize":"1mb"},
      {"file_name":"/etc/runnerty/RES_MYSQL.csv", "write":[":PROCESS_EXEC_DB_RESULTS_CSV"], "concat":false, "maxsize":"1mb"}],
    "output_iterable":"PROCESS_EXEC_DB_RESULTS",
    "events":{
      "on_start":{
        "notifications":[
          {
            "type":"slack",
            "id":"slack_default",
            "bot_emoji": ":rabbit2:",
            "channel": "mlm",
            "message":"INICIO DEL PROCESO *:PROCESS_ID* DE LA CADENA :CHAIN_ID"
          }
        ]
      },
      "on_fail":{
        "notifications":[
          {
            "type":"slack",
            "id":"slack_default",
            "bot_emoji": ":see_no_evil:",
            "channel": "mlm",
            "message":"ERROR EN EL PROCESO *:PROCESS_ID* DE LA CADENA :CHAIN_ID - :PROCESS_EXECUTE_ERR_RETURN / :PROCESS_EXECUTE_RETURN"
          }
        ]
      },
      "on_retry":{},
      "on_end":{
        "notifications":[
          {
            "type":"slack",
            "id":"slack_default",
            "bot_emoji": ":see_no_evil:",
            "channel": "mlm",
            "message":"FIN DEL PROCESO *:PROCESS_ID* DE LA CADENA :CHAIN_ID - :PROCESS_EXECUTE_ERR_RETURN / :PROCESS_EXECUTE_RETURN"
          }
        ]
      },
      "on_waiting_dependencies":{},
      "on_exceeded_limited_time_end":{}
    }
  }
  ]
},
  {
    "id":"CHAIN_TEST_ITERABLE_OBJECT",
    "name":"CADENA DE PRUEBA ITERABLE",
    "iterable":true,
    "depends_chains":[{"chain_id":"CHAIN_UNO","process_id":"PROC_LAUNCHER"}],
    "input":[{"MY_VAR_ID":"id"},{"MY_VAR_NAME":"text"}],
    "events":{"on_start":{},"on_end":{}, "on_waiting_dependencies":{}, "on_exceeded_limited_time_end":{}},
    "processes":[{
      "id":"PROCCESS_ITERABLE",
      "name":"Concatenador de CSVs",
      "depends_process":[],
      "exec":{"command":"echo", "type":"command"},
      "args": ["EL ID ES :MY_VAR_ID", " Y EL NOMBRE :MY_VAR_NAME"],
      "retries":0,
      "retry_delay":0,
      "end_chain_on_fail":false,
      "output":[{"file_name":"/etc/runnerty/ITERABLE.log", "write":["SALIDA :PROCESS_EXECUTE_RETURN"], "concat":true, "maxsize":"1mb"}],
      "events":{
        "on_start":{
          "notifications":[
            {
              "type":"slack",
              "id":"slack_default",
              "bot_emoji": ":rabbit2:",
              "channel": "mlm",
              "message":"INICIO DEL PROCESO *:PROCESS_ID* DE LA CADENA ITERABLE :CHAIN_ID CON :MY_VAR_ID Y :MY_VAR_NAME"
            }
          ]
        },
        "on_fail":{
          "notifications":[
            {
              "type":"slack",
              "id":"slack_default",
              "bot_emoji": ":see_no_evil:",
              "channel": "mlm",
              "message":"ERROR EN EL PROCESO *:PROCESS_ID* DE LA CADENA ITERABLE :CHAIN_ID - :PROCESS_EXECUTE_ERR_RETURN / :PROCESS_EXECUTE_RETURN"
            }
          ]
        },
        "on_retry":{},
        "on_end":{
          "notifications":[
            {
              "type":"slack",
              "id":"slack_default",
              "bot_emoji": ":rabbit2:",
              "channel": "mlm",
              "message":"FIN DEL PROCESO *:PROCESS_ID* DE LA CADENA ITERABLE :CHAIN_ID"
            }
          ]
        },
        "on_waiting_dependencies":{},
        "on_exceeded_limited_time_end":{}
      }
    }
    ]
  }
]
}