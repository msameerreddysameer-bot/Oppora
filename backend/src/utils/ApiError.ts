class ApiError extends Error {
    
    statusCode:number;
    errors:string[];
    data:any;
    success:boolean


    constructor(
        statusCode:number,
        message:string = "something went wrong" ,
        errors:string[]=[] ,
        stack:string=""
        ){
        super(message)
        this.statusCode=statusCode
        this.message=message
        this.data = null
        this.errors=errors
        this.success=false
        
        if(stack){
            this.stack=stack
        }
        else{
            Error.captureStackTrace(this,this.constructor)
        }


}
}

export { ApiError}