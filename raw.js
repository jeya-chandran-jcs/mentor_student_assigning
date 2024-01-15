app.post("/mentor",async (req,res)=>{
 
    const client = await clientPromise
    const result = await client.db("Mentor_students").collection("mentor").insertMany(req.body)
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
                        as: "studentAssign"
                    }
                },
                {
                    $unwind: "$studentAssign"
                },
                {
                    $group: {
                        _id: {
                            mentorID: "$mentorID",
                            studentID: "$studentAssign.studentID"
                        },
                        mentor: { $first: "$name" }, 
                        studentAssign: { $first: "$studentAssign" }
                    }
                },
                {
                    $group: {
                        _id: "$_id.mentorID",
                        mentor: { $first: "$mentor" },
                        students: {
                            $push: {
                                studentID: "$_id.studentID",
                                studentName: "$studentAssign.name"
                            }
                        },
                        count: { $sum: "$studentAssign.studentID" }
                    }
                },
                {
                    $unwind:"$students"
                },
                {
                    $project: {
                        _id: 0,
                        mentor: 1,
                        students: 1,
                        count: 1
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
