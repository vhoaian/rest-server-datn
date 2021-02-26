class Normalize
{

    /**
    * Normalize a port into a number, string, or false.
    */
    static nomalizePort(value)
    {
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
    }
}

module.exports = Normalize;