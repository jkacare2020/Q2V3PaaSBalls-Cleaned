from fastapi import FastAPI

# Create the FastAPI app
app = FastAPI()

# Define a root endpoint
@app.get("/")
async def root():
    return {"message": "FastAPI server is running!"}
@app.get("/hello")
async def say_hello():
    return {"message": "Hello, FastAPI!"}

@app.get("/square/{number}")
async def square(number: int):
    return {"number": number, "square": number * number}
