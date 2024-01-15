import express from "express"
import {MongoClient} from "mongodb"
import * as dotenv from "dotenv"

dotenv.config()
const app= express()
app.use(express.json())

const PORT = process.env.PORT


const Mongo_URL=process.env.Mongo_Url

const CreateConnection = async()=>{
    try{
        const client= new MongoClient(Mongo_URL)
        await client.connect()
        console.log("MongoDB connected")
        return client
    }
    catch(err){
        console.log("client connection error",err)
    }
}
const clientPromise=CreateConnection()

app.get("/",(req,res)=>{
    res.send("hello this are all my paths  /assign_student  ,  /mentor , /student    , /assignOneMentor   ,  /getallmentor  ,  /previousMentor")
})

app.post("/mentor",async(req,res)=>{
    try{
        const client = await clientPromise
    const result=await client.db("Mentor_students").collection("mentor").insertMany(req.body)
    res.send(result)
    }
    catch(err){
        console.log("mentor post error",err)
        res.send({message:"error in mentor post"})
    }
})

app.get("/mentor",async (req,res)=>{
    const client = await clientPromise
    const result=await client.db("Mentor_students").collection("mentor").find().toArray()
    res.send(result)
})

app.post("/student",async(req,res)=>{
    const client= await clientPromise
    const result=await client.db("Mentor_students").collection("student").insertMany(req.body)
    res.send(result.ops)
})

app.get("/student",async (req,res)=>{
    const client = await clientPromise
    const result=await client.db("Mentor_students").collection("student").find().toArray()
    res.send(result)
})
app.get("/assign_student", async (req, res) => {
    try {
        const client = await clientPromise;

        const result = await client
            .db("Mentor_students")
            .collection("mentor")
            .aggregate([
                {
                    $lookup: {
                        from: "student",
                        localField: "mentorID",
                        foreignField: "studentID",
                        as: "students"
                    }
                },
                {
                    $addFields: {
                        mentor: "$name",
                        students:{
                                studentID:"$studentID",
                                studentName:"$name"
                        }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        mentor: 1,
                        students: 1,
                        count: { $size: "$students" } // If you want to count the number of students
                    }
                }
            ])
            .toArray();

        res.send(result);
    } catch (err) {
        console.log("assign_student error", err);
        res.send({ message: "error in assign_student" });
    }
});
//assigning one student and one mentor
app.get("/assignOneMentor",async(req,res)=>{
    const client= await clientPromise
    const result = await client.db("Mentor_students").collection("student").aggregate([
        {
            $lookup:{
                from:"mentor",
                localField:"studentID",
                foreignField:"mentorID",
                as:"assignOne"
            }
        },{
            $unwind:"$assignOne"
        },{
            $group:{
                _id:"$assignOne.mentorID",
                student:{$first:"$name"},
                mentor:{$first:"$assignOne.name"}
            }
        }
    ]).toArray()
    res.send(result)
})

app.get("/getallmentor",async(req,res)=>{
    const client=await clientPromise
    const result= await client.db("Mentor_students").collection("student").aggregate([
        {
            $lookup:{
                from:"mentor",
                localField:"studentID",
                foreignField:"mentorID",
                as:"getallmentor"
            }
        },{
            $unwind:"$getallmentor"
        },{
            $group:{
                _id:"$getallmentor.mentorID",
                name:{$first:"$getallmentor.name"},
                student:{$first:"$name"}
            }
        },{
            $project:{
                _id:0,
                mentor:"$name",
                student:1
            }
        }
    ]).toArray()
    res.send(result)
})

app.get("/previousMentor", async (req, res) => {
    try {
        const client = await clientPromise;
        const result = await client.db("Mentor_students").collection("student").aggregate([
                {
                    $lookup: {
                        from: "mentor",
                        localField: "studentID",
                        foreignField: "mentorID",
                        as: "previousMentor"
                    }
                },
                {
                    $unwind: "$previousMentor"
                },{
                    $sort:{name:-1}
                },{
                    $project: {
                        _id: 0,
                        name: 1,
                        previousMentor: 1
                    }
                }
            ])
            .toArray();

        res.send(result);
    } catch (err) {
        console.log("previousMentor error", err);
        res.status(500).send({ message: "Internal Server Error" });
    }
});


// Start server
app.listen(PORT, () => console.log("Server is started on port", PORT));