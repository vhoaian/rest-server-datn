const Normalize =
{
    /**
    * Normalize a port into a number, string, or false.
    */
    nomalizePort: (value) =>{
        const port = parseInt(value, 10);

        if (isNaN(port)) {
          // named pipe
          return val;
        }
      
        if (port >= 0) {
          // port number
          return port;
        }
      
        return false;
    },

    nomalizeResponse: (success, message, data)=> ({
        success: success,
        message: message,
        data: data
    })
}

module.exports = Normalize;