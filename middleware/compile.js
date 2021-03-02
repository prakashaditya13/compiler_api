const fs = require('fs')
const {spawn} = require('child_process')
const {performance} = require('perf_hooks')
// Performing all compilation process will happens here

const Compilation = (req, res, next) => {
    // stored a req data into an object
    const Data = {
        // we request a couple of data for compiling a particular code
        'langName': req.body.LA_NAME,  // LA_NAME will be the input field name on the client side
        'inputData': req.body.INPUT_DATA,  // INPUT_DATA will be the custom input field on the client side
        'code': req.body.CODE // CODE will be the actual program which is executed
    }

    // Meta Data object
    const langMetaData = {
        cplus: {
            filename: "main.cpp", 
            command : "g++ -o ./program/Test ./program/main.cpp && ./program/Test",
            inputCommand: "g++ -o ./program/Test ./program/main.cpp && ./program/Test < ./program/input.txt" 
        },
        python3: {
            filename: "Main.py",
            command: "python3 ./program/Main.py",
            inputCommand: "python3 ./program/Main.py < ./program/input.txt"
        },
        java: {
            filename: "Main.java",
            command: "javac ./program/Main.java && java -cp ./program Main",
            inputCommand: "javac ./program/Main.java && java -cp ./program Main < ./program/input.txt"
        },
        c: {
            filename: "main.c",
            command: "gcc ./program/main.c -o ./program/Test && ./program/Test",
            inputCommand: "gcc ./program/main.c -o ./program/Test && ./program/Test < input.txt"
        },
        inputFileName: "input.txt",
        bashFileName: "bash.sh",
        folderName: "program"
    }
    // Making directory 
    // we have to make directive asynchronous call
    fs.mkdirSync(langMetaData.folderName)
        switch (Data.langName) {
            /*
            -> Firstly, after matching with particular case we make the folder
            -> then, we create a dynamic program file,
            -> put the program file into that folder
            -> again if required then we also create a input file according to the data passing through request object and put into the folder
            -> execute the program files
            -> stored an output of the program into an json object
            -> After finally successfully execution of program we have to delete the all exec or program files and folder from the server
            */
            case 'c++':
                createProgramFile(langMetaData.cplus.filename, Data.code, langMetaData.folderName)
                Compile(Data.langName, req, next, Data.inputData, langMetaData.cplus.command, langMetaData.folderName, langMetaData.cplus.filename, langMetaData.inputFileName, langMetaData.cplus.inputCommand)
                break;
            case 'java':
                createProgramFile(langMetaData.java.filename, Data.code, langMetaData.folderName)
                Compile(Data.langName, req, next, Data.inputData, langMetaData.java.command, langMetaData.folderName, langMetaData.java.filename, langMetaData.inputFileName, langMetaData.java.inputCommand)
                break;
            case 'python3':
                createProgramFile(langMetaData.python3.filename, Data.code, langMetaData.folderName)
                Compile(Data.langName, req, next, Data.inputData, langMetaData.python3.command, langMetaData.folderName, langMetaData.python3.filename, langMetaData.inputFileName, langMetaData.python3.inputCommand)
                break;
            case 'c':
                createProgramFile(langMetaData.c.filename, Data.code, langMetaData.folderName)
                Compile(Data.langName, req, next, Data.inputData, langMetaData.c.command, langMetaData.folderName, langMetaData.c.filename, langMetaData.inputFileName, langMetaData.c.inputCommand)
                break;
            default:
                break;
        }

}

exports.LANG = Compilation
  
function createProgramFile(filename, code, folderName){
    // var bashFileData = ["#!/bin/bash",command]
    fs.writeFileSync(`./${folderName}/${filename}`,code.join('\r'))
        // fs.writeFile(`./${folderName}/${bashName}`, bashFileData.join('\r\n'), (error) => {
        //     if(error) throw error
        // })
        // Using .sh file to execute programs is little bit tricky and you have to pass a system password to it.

}  

function Compile(lang, req, next, inputData, command, folderName, filename, inputFileName, inputCommand){
    if(inputData === ""){
        // spawn("chmod", ['+x', './program/bash.sh'])
        // spawn("sed",['-i','-e','s/\r$//','./program/bash.sh'])  
        t0 = performance.now()
        const child = spawn(command,{ 
            shell: true // This command is used to execute a multiple commands in single line with && separated operator
        }) 
        // This statetment handle hold request if the req was made but doesn't give any output and not working properly.       
        // if(t0 >= 2){  This t0 >=2 won't work because t0 value is always greater than 2
        //     req.body.time = t0/1000
        //     req.body.out = "Please check your input or network issue!"
        //     fs.unlinkSync(`./${langMetaData.folderName}/${langMetaData.cplus.filename}`)
        //     fs.unlinkSync(`./${langMetaData.folderName}/Test`)
        //     fs.rmdirSync(`${langMetaData.folderName}`)
        //     next()
        // } 
        child.stdout.on('data', (data) => { 
            var out = data.toString('utf8')
            t1 = performance.now() 
            req.body.time = (t1-t0)/1000 
            req.body.out = out 
            fs.unlinkSync(`./${folderName}/${filename}`)
            // (lang === "c++") ? fs.unlinkSync(`./${folderName}/Test`):null
            if(lang==="c++" || lang==="c"){
                fs.unlinkSync(`./${folderName}/Test`)
            }
            if(lang==="java"){
                fs.unlinkSync(`./${folderName}/Main.class`)
            }
            fs.rmdirSync(`${folderName}`)
            next()     
        })   

        child.stderr.on('data', (data) => {
            req.body.error = data.toString('utf8')  
            t1 = performance.now() 
            req.body.time = (t1-t0)/1000  
            fs.unlinkSync(`./${folderName}/${filename}`)
            fs.rmdirSync(`${folderName}`)
            next()
        })   

        child.on('error', (error) => {
            console.log("ERROR:"+error.message)
        })

        child.on('exit', (code, signal) => {
            if(code){
                console.log(`Process exit with code: ${code}`)
            }
            if(signal) console.log(`Process killed with signal: ${signal}`)
            console.log("Success...")
        })  
    }else{
        // If input data is not empty then create a .txt file and put it into program folder
        // We have also to response back a message if the program takes more time to execute i.e may be user provide wrong or half input value                    
        fs.writeFileSync(`./${folderName}/${inputFileName}`,inputData)
        t0 = performance.now()
        const child = spawn(inputCommand,{ 
            shell: true // This command is used to execute a multiple commands in single line with && separated operator
        })  
        child.stdout.on('data', (data) => { 
            var out = data.toString('utf8')
            t1 = performance.now() 
            req.body.time = (t1-t0)/1000  
            req.body.out = out 
            fs.unlinkSync(`./${folderName}/${filename}`)
            if(lang==="c++" || lang==="c"){
                fs.unlinkSync(`./${folderName}/Test`)
            }
            if(lang==="java"){
                fs.unlinkSync(`./${folderName}/Main.class`)
            }
            // (lang === "c++") ? fs.unlinkSync(`./${folderName}/Test`):null
            fs.unlinkSync(`./${folderName}/${inputFileName}`)
            fs.rmdirSync(`${folderName}`)
            next()  
        })   

        child.stderr.on('data', (data) => {
            req.body.error = data.toString('utf8')  
            t1 = performance.now() 
            req.body.time = (t1-t0)/1000  
            next()
            fs.unlinkSync(`./${folderName}/${filename}`)
            fs.unlinkSync(`./${folderName}/${inputFileName}`)
            fs.rmdirSync(`${folderName}`)
        }) 

        child.on('error', (error) => {
            console.log(error.message)
        })

        child.on('exit', (code, signal) => {
            if(code){
                console.log(`Process exit with code: ${code}`)
            }
            if(signal) console.log(`Process killed with signal: ${signal}`)
            console.log("Success...")
        })
    }
}
