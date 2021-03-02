const express = require('express')
const inputData = require('./middleware/inputCheck')
const compile = require('./middleware/compile')
const app = express()

// for body parsing
app.use(express.json())

app.post('/compile',inputData.customInput, compile.LANG, (req, res) => {
    var output = req.body.out
    var Exectime = req.body.time
    var error = req.body.error 
    res.status(200).json({
        error: error || null,  
        execution_time : `${Exectime.toFixed(4)}ms`,   
        output: output || null 
    }) 
})

// checking for invalid routes
app.use((req, res) => {
    res.status(404).json({
        Invalid_routes: {
            'Error route': req.url,
            'status': 'Server Error',
            'message' : 'Invalid Request',
            'StatusCode' : 404,
        }
    })
})

const PORT = 4500 || 80
app.listen(PORT, () => {
    console.log(`Server api running on http://localhost:${PORT}`)
})