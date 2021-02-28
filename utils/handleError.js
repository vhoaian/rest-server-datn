module.exports = handleError = (Promise) =>{
    return Promise.then(data => [data, undefined]).
    catch(err => [undefined, err]);
}