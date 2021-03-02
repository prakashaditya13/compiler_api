// creating custom middleware
const isemptyInput = (req, res, next) => {
    if(req.body.CODE === ""){
        return res.json({
             message: "You didn't written code yet!"
         });
     }else {
         next() 
     }
}

exports.customInput = isemptyInput
