const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const nodemailer = require("nodemailer");
const fs = require('fs')

const app = express()

app.set('view engine','ejs');
app.use(express.static(path.join(__dirname , '/public')))

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); 

// Session setup

// app.use(
//     session({
//         key:'user_sid',
//         secret:"thisisrandomstuff",
//         resave:false,
//         saveUninitialized:false,
//         cookie:{
//             expires:6000000
//         }
//     })
// )

// Session based authontication middleware

// app.use((req,res,next)=>{
//     if(req.session.userName){
//         res.redirect('/admin')
//     }
//     next()
// })
// var sessionChecker = (req,res)=>{
//     if(req.session.userName){
//         res.redirect(`/admin?name=${adminName}`)
//     }else{
//         res.redirect('/login')
//     }
// } 

// Database connectivity
const db = mysql.createPool({
    host : 'localhost',
    user:'root',
    password : "",
    database : 'fulllaec',
})

// Home page route

app.get('/',(req,res)=>{
    res.sendFile(__dirname+"/public/index.html")
})

// nodeMsailer setup
 
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  auth: {
    user: "harishmanure0@gmail.com",
    pass: "wifuwghwqmijfrne",
  },
});

function sendMail(to ,sub ,mess){
    transporter.sendMail({
        to:to,
        subject:sub,
        text:mess
    })
}


// Main login route

app.get('/login',(req,res)=>{
    res.sendFile(__dirname+"/public/login.html")
})

var adminDept ;
app.post('/login', async(req,res)=>{

    // login as admin

    if(req.body.option == 'admin'){
        const id = req.body.id ;
        const password = req.body.password ;
        const dept = req.body.dept ;
        const sql = 'select * from admin where id = ?'
        db.query(sql,id,(err,rest)=>{
            if(rest.length > 0 ){
                if(rest[0].id == id && rest[0].password == password && rest[0].dept == dept){
                    adminDept = rest[0].dept ;
                    let name = rest[0].name;
                    res.redirect(`/admin?name=${rest[0].name}`)
                }else{
                    console.log('Invalid details')
                    res.redirect('/login')
                }
            }else{
                res.redirect('/login')
            }
            })

            // login as student

    }else if(req.body.option == "student"){
        const usn = req.body.id ;
        const password = req.body.password ;
        const dept = req.body.dept ;
        const sql = 'select * from students where usn = ?'
        db.query(sql,usn,(err,rest)=>{
            if(rest.length > 0 ){
                if(rest[0].usn == usn && rest[0].password == password && rest[0].dept == dept){
                    res.redirect(`/student?usn=${rest[0].usn}`)
                }else{
                    console.log('Invalid details')
                    res.redirect('/login')
                }
            }else{
                res.redirect('/login')
            }
            })

            // login as staff

    }else if(req.body.option == "staff"){
        const id = req.body.id ;
        const password = req.body.password ;
        const dept = req.body.dept ;
        const sql = 'select * from staff where id = ?'
        db.query(sql,id,(err,rest)=>{
            if(rest.length > 0 ){
                if(rest[0].id == id && rest[0].password == password && rest[0].dept == dept){
                    res.redirect(`/staff?id=${rest[0].id}`)
                }else{
                    console.log('Invalid details')
                    res.redirect('/login')
                }
            }else{
                res.redirect('/login')
            }
            })
    }
})

// Admin routes
var adminName;
app.get('/admin',(req,res)=>{
    var name = req.query.name;
    adminName = req.query.name
    var sql = "SELECT * from admin where name=?"
    db.query(sql,name,(error,result)=>{
        if(error){console.log("Error in rendering Admin page")}
        else{
            res.render(__dirname+"/ejs-files/admin.ejs" ,{result})
        }
    })
})
app.get('/admin/students',(req,res)=>{
    res.render(__dirname+"/ejs-files/studentAndStaff.ejs",{adminName , adminDept})
})

app.get('/admin/update-student',(req,res)=>{
    var usn = req.query.usn ;
    var sql = "SELECT * FROM students WHERE usn=?"
    db.query(sql,usn,(error,result)=>{
        if(error){console.log("error in updating student")}
        else{
            res.render(__dirname+"/ejs-files/updateStudent.ejs",{result})
        }
    })
})
app.post('/admin/update-student',(req,res)=>{
        var name = req.body.name;
       var password = req.body.password;
       var usn = req.body.usn;
       var sem = req.body.sem;
       var email = req.body.email;
       var phone = req.body.phone; 
       var un = req.query.usn;
    var sql = "UPDATE students SET `name`=?,`password`=?,`usn`=?,`sem`=?,`email`=?,`phone`=? WHERE usn=?";
    db.query(sql,[name,password ,usn,sem,email,phone,un ],(error,result)=>{
        if(error){
            console.log("error in updating")
        }else{
            res.redirect(`/admin/student-details?sem=${sem}`)
        }
    })
})
app.get('/admin/delete-student',(req,res)=>{
    var usn = req.query.usn ;
    var sqlO = `SELECT * FROM students WHERE usn=?`;
    var sqlI = `DELETE FROM students WHERE usn=?`
    db.query(sqlO,usn,(error,result)=>{
        if(error){console.log("Issue in select usn")}
        else{
            var sem = result[0].sem;
            console.log(sem)
            db.query(sqlI,usn,(errr,ress)=>{
                if(errr){console.log("Issue in deleting")}
                else{
                    res.redirect(`/admin/student-details?sem=${sem}`)
                }
            })
        }
    })
})
app.get('/admin/view-student' , (req,res)=>{
    var name = req.query.usn;
    var sql = "SELECT * from students where usn=?"
    db.query(sql,name,(error,result)=>{
        if(error){console.log("Error in rendering student page")}
        else{
            var sem = result[0].sem;
            var sqlS = "SELECT * FROM `subjects` WHERE sem=? and dept=?"
            db.query(sqlS,[sem,result[0].dept],(errr,rest)=>{
                res.render(__dirname+"/ejs-files/viewStd-main.ejs",{result,rest,adminName,adminDept})
            })
        }
    })
})
app.get('/admin/view-student/attendence',(req,res)=>{
    var usn = req.query.usn ;
    var subcode = req.query.subcode ; 
    var sql1 = "SELECT * FROM `students` WHERE usn=?";
    var sql2 = "SELECT * FROM `subjects` WHERE subcode=?";
    var sql3 = `SELECT * FROM attendence WHERE JSON_EXTRACT(attend,'$.${usn}')='present' AND JSON_EXTRACT(attend,'$.subjectCode')='${subcode}' `;
    var sql4 = `SELECT * FROM attendence WHERE JSON_EXTRACT(attend,'$.${usn}')='absent' AND JSON_EXTRACT(attend,'$.subjectCode')='${subcode}' `;
    db.query(sql1 , usn , (errr,rest)=>{
        db.query(sql2 , subcode , (error,result)=>{
            db.query(sql3,(err,Prst)=>{
                db.query(sql4,(err,Arst)=>{
                    res.render(__dirname+"/ejs-files/viewStd-attendence.ejs",{rest,result,Prst,Arst,adminName,adminDept})
                })
            })
        })
    })
})

app.get('/admin/student-details',(req,res)=>{
    var sem = req.query.sem;
    var sql = `select * from students where sem = ? and dept = ?` 
    db.query(sql,[sem,adminDept],(error,result)=>{
        if(error){
            console.log('Error in retriving student data')
        }else{
            res.render(__dirname + "/ejs-files/studentDetail.ejs",{result})
        }
    })
})
app.get('/admin/student-regester',(req,res)=>{
    res.sendFile(__dirname+"/public/std-regester.html")
})
app.post('/admin/student-regester',(req,res)=>{
       var name = req.body.name;
       var password = req.body.password;
       var usn = req.body.usn;
       var sem = req.body.sem;
       var email = req.body.email;
       var phone = req.body.phone; 
    var sql = "INSERT INTO students(`name`, `password`, `usn`, `sem`, `email`, `phone`,`dept`) VALUES ( ?,?,?,?,?,?,?)";
    db.query(sql,[name,password ,usn,sem,email,phone,adminDept],(error,result)=>{
        if(error){
            console.log("error in inserting")
        }else{
            res.redirect(`/admin?name=${adminName}`)
        }
    })
})

// admin - staff 

app.get('/admin/staff-regester',(req,res)=>{
    res.sendFile(__dirname+"/public/staff-regester.html")
})
app.post('/admin/staff-regester',(req,res)=>{
        var name = req.body.name;
        var id = req.body.id;
        var password = req.body.password;
        var phone = req.body.phone;
        var email = req.body.email;
        var type = req.body.staffType; 
    var sql = "INSERT INTO staff(`name`, `id`, `password`, `phone`, `email`, `type`,`dept`) VALUES (?,?,?,?,?,?,?)";
    db.query(sql,[name,id,password,phone,email,type,adminDept ],(error,result)=>{
        if(error){
            console.log("Error in inserting")
        }else{
            res.redirect(`/admin?name=${adminName}`)
        }
    })
})
app.get('/admin/staff-details',(req,res)=>{
    var type = req.query.type;
    var sql = `select * from staff where type = ? and dept = ?` 
    db.query(sql,[type,adminDept],(error,result)=>{
        if(error){
            console.log('Error in retriving student data')
        }else{
            res.render(__dirname + "/ejs-files/staffDetail.ejs",{result})
        }
    })
})
app.get('/admin/update-staff',(req,res)=>{
    var id = req.query.id ;
    var sql = "SELECT * FROM staff WHERE id=?"
    db.query(sql,id,(error,result)=>{
        if(error){console.log("error in updating staff")}
        else{
            res.render(__dirname+"/ejs-files/updateStaff.ejs",{result})
        }
    })
})
app.post('/admin/update-staff',(req,res)=>{
    var name = req.body.name;
   var password = req.body.password;
   var id = req.body.id;
   var type = req.body.staffType;
   var email = req.body.email;
   var phone = req.body.phone; 
   var un = req.query.id;
var sql = "UPDATE `staff` SET `name`=?,`id`=?,`password`=?,`phone`=?,`email`=?,`type`=? WHERE `id`=?";
db.query(sql,[name,id,password,phone,email,type,un ],(error,result)=>{
    if(error){
        console.log("error in updating")
    }else{
        res.redirect(`/admin/staff-details?type=${type}`)
    }
})
})
app.get('/admin/delete-staff',(req,res)=>{
    var id = req.query.id ;
    var sqlO = `SELECT * FROM staff WHERE id=?`;
    var sqlI = `DELETE FROM staff WHERE id=?`
    db.query(sqlO,id,(error,result)=>{
        if(error){console.log("Issue in select id")}
        else{
            var type = result[0].type;
            console.log(type)
            db.query(sqlI,id,(errr,ress)=>{
                if(errr){console.log("Issue in deleting")}
                else{
                    res.redirect(`/admin/staff-details?type=${type}`)
                }
            })
        }
    })
})
app.get('/admin/view-staff' , (req,res)=>{
    var id = req.query.id;
    var sql = "SELECT * from staff where id=?";
    db.query(sql,id,(error,result)=>{
        if(error){console.log("Error in rendering staff page")}
        else{
            var sqlL = "SELECT * from subjects where id=?";
            db.query(sqlL , id , (errr,rest)=>{
                res.render(__dirname+"/ejs-files/viewStaff-main.ejs" ,{result , rest , adminName ,adminDept})
            })
        }
    })
})
app.get('/admin/view-staff/class',(req,res)=>{
    var id = req.query.id ;
    var subcode = req.query.subcode ; 
    var sql1 = "SELECT * FROM `staff` WHERE id=?";
    var sql2 = "SELECT * FROM `subjects` WHERE subcode=?";

    db.query(sql1 , id , (errr,rest)=>{
        db.query(sql2 , subcode , (error,result)=>{
            var subNam = result[0].subname ;
            var sqlC = `SELECT * FROM attendence WHERE JSON_EXTRACT(attend,'$.subjectName')='${subNam}'`;
            db.query(sqlC,(err,ress)=>{
                res.render(__dirname+"/ejs-files/viewStaff-class.ejs",{rest,result,ress,adminName,adminDept})
                
            })
        })
    })
})
app.get('/admin/view-staff/class/info' ,(req,res)=>{
    var subcode = req.query.sub ;
    var date = req.query.date ;
    var time = req.query.time ;

    const sql = `SELECT * FROM attendence WHERE JSON_EXTRACT(attend,'$.subjectCode')='${subcode}' AND JSON_EXTRACT(attend,'$.date')='${date}' AND JSON_EXTRACT(attend,'$.time')='${time}'` ;
    db.query(sql,(err,rest)=>{
        if(err){console.log('error in rendering class data')}
        else{
            var mainData = JSON.parse(rest[0].attend);
            var SubInfo = Object.values(mainData).splice(0,6)
            var StdInfo = Object.entries(mainData).splice(6)
            res.render(__dirname+'/ejs-files/classInfo.ejs',{SubInfo,StdInfo})
        }
    })
})
 // admin subject
app.get('/admin/subjectPage',(req,res)=>{
    res.render(__dirname+"/ejs-files/subjectPage.ejs",{adminName ,adminDept})
})
app.get('/admin/subjectPage/addSubject',(req,res)=>{
    res.sendFile(__dirname+"/public/addSubject.html")
})
app.post('/admin/subjectPage/addSubject',(req,res)=>{
    var lecture = req.body.lecturename;
    var id = req.body.lectureid;
    var subname = req.body.subname;
    var subcode = req.body.subcode;
    var sem = req.body.sem;
    var sql = "INSERT INTO subjects(`sem`, `subname`, `subcode`, `lecture`, `id` ,`dept`) VALUES (?,?,?,?,?,?)";

    db.query(sql,[sem,subname,subcode,lecture,id,adminDept],(error,result)=>{
        if(error){console.log("error in adding subjects")}
        else{
            res.redirect(`/admin/subjectPage?name=${adminName}`)
        }
    })
})
app.get('/admin/subjectPage/subjects',(req,res)=>{
    var sem = req.query.sem;
    var sql = "SELECT * FROM subjects WHERE sem=? and dept=?";
    db.query(sql , [sem,adminDept] ,(error,result)=>{
        res.render(__dirname+"/ejs-files/subject.ejs",{result})
    })
})
app.get('/admin/subjectPage/updatesub',(req,res)=>{
    var subcode = req.query.subcode ;
    var sql = "SELECT * FROM subjects WHERE subcode=?"
    db.query(sql,subcode,(error,result)=>{
        if(error){console.log("error in updating subjects")}
        else{
            res.render(__dirname+"/ejs-files/updateSubject.ejs",{result})
        }
    })
})
app.post('/admin/subjectPage/updatesub',(req,res)=>{
    var lecture = req.body.lecturename;
    var id = req.body.lectureid;
    var subname = req.body.subname;
    var subcode = req.body.subcode;
    var sem = req.body.sem;
    var idq =req.query.subcode;
var sql = "UPDATE `subjects` SET `sem`=?,`subname`=?,`subcode`=?,`lecture`=?,`id`=? WHERE subcode=?";
db.query(sql,[sem,subname,subcode,lecture,id,idq ],(error,result)=>{
    if(error){
        console.log("error in updating")
    }else{
        res.redirect(`/admin/subjectPage/subjects?sem=${sem}`)
    }
})
})
app.get('/admin/subjectPage/deletesub',(req,res)=>{
    var subcode = req.query.subcode ;
    var sqlO = `SELECT * FROM subjects WHERE subcode=?`;
    var sqlI = `DELETE FROM subjects WHERE subcode=?`
    db.query(sqlO,subcode,(error,result)=>{
        if(error){console.log("Issue in selecting subcode")}
        else{
            var sem = result[0].sem;
            db.query(sqlI,subcode,(errr,ress)=>{
                if(errr){console.log("Issue in deleting")}
                else{
                    res.redirect(`/admin/subjectPage/subjects?sem=${sem}`)
                }
            })
        }
    })
})
// student route

app.get('/student',(req,res)=>{
    var name = req.query.usn;
    var sql = "SELECT * from students where usn=?"
    db.query(sql,name,(error,result)=>{
        if(error){console.log("Error in rendering student page")}
        else{
            var sem = result[0].sem;
            var sqlS = "SELECT * FROM `subjects` WHERE sem=? and dept=?"
            db.query(sqlS,[sem,result[0].dept],(errr,rest)=>{
                res.render(__dirname+"/ejs-files/studentPage.ejs" ,{result,rest})
            })
        }
    })
})
app.get('/student/attendenc',(req,res)=>{
    var usn = req.query.usn ;
    var subcode = req.query.subcode ; 
    var sql1 = "SELECT * FROM `students` WHERE usn=?";
    var sql2 = "SELECT * FROM `subjects` WHERE subcode=?";
    var sql3 = `SELECT * FROM attendence WHERE JSON_EXTRACT(attend,'$.${usn}')='present' AND JSON_EXTRACT(attend,'$.subjectCode')='${subcode}' `;
    var sql4 = `SELECT * FROM attendence WHERE JSON_EXTRACT(attend,'$.${usn}')='absent' AND JSON_EXTRACT(attend,'$.subjectCode')='${subcode}' `;
    db.query(sql1 , usn , (errr,rest)=>{
        db.query(sql2 , subcode , (error,result)=>{
            db.query(sql3,(err,Prst)=>{
                db.query(sql4,(err,Arst)=>{
                    res.render(__dirname+"/ejs-files/attendenc.ejs",{rest,result,Prst,Arst})
                })
            })
        })
    })

})

// Staff route
app.get('/staff',(req,res)=>{
    var id = req.query.id;
    var sql = "SELECT * from staff where id=?";
    db.query(sql,id,(error,result)=>{
        if(error){console.log("Error in rendering staff page")}
        else{
            var sqlL = "SELECT * from subjects where id=?";
            db.query(sqlL , id , (errr,rest)=>{
                res.render(__dirname+"/ejs-files/staffPage.ejs" ,{result , rest})
            })
        }
    })
})
var id ;
app.get('/staff/class',(req,res)=>{
    id = req.query.id ;
    var subcode = req.query.subcode ; 
    var sql1 = "SELECT * FROM `staff` WHERE id=?";
    var sql2 = "SELECT * FROM `subjects` WHERE subcode=?";

    db.query(sql1 , id , (errr,rest)=>{
        db.query(sql2 , subcode , (error,result)=>{
            var subNam = result[0].subname ;
            var sqlC = `SELECT * FROM attendence WHERE JSON_EXTRACT(attend,'$.subjectName')='${subNam}'`;
            db.query(sqlC,(err,ress)=>{
                res.render(__dirname+"/ejs-files/class.ejs",{rest,result,ress})
                
            })
        })
    })

})
app.get('/staff/class/take',(req,res)=>{
    var subcode = req.query.subcode ;
    var sql = "SELECT * FROM `subjects` WHERE subcode=?";
    db.query(sql,subcode,(error,result)=>{
        var sem = result[0].sem ;
        var sqlF = "SELECT * FROM `students` WHERE sem=? and dept=?";
        db.query(sqlF,[sem,result[0].dept],(errr,rest)=>{
            res.render(__dirname+"/ejs-files/take.ejs",{rest,result})
        })
    })
})
app.post('/staff/class/take',(req,res)=>{
    var attendedData = req.body ;
    var attended = JSON.stringify(attendedData);
    var absentStudents = Object.keys(attendedData).filter(key => attendedData[key] === 'absent');
    absentStudents.forEach((absentStudent) => {
        var sqlMess = "SELECT email from students WHERE usn=?";
        db.query(sqlMess , absentStudent ,(erro, resu)=>{
            if(erro){console.log("getting student mails")}
            else{
                sendMail(`${resu[0].email}`,'LAEC Attendence INFO','Today your Son/Daughter are absent for class')
            }
        })
    })
    var sql = `INSERT INTO attendence VALUES ('${attended}')`
    db.query(sql,(error,result)=>{        
        if(error){console.log("error in taking attendence")}
        else{
            res.redirect(`/staff?id=${id}`)
        }
    })
})
app.get('/staff/class/info',(req,res)=>{
    var subcode = req.query.sub ;
    var date = req.query.date ;
    var time = req.query.time ;

    const sql = `SELECT * FROM attendence WHERE JSON_EXTRACT(attend,'$.subjectCode')='${subcode}' AND JSON_EXTRACT(attend,'$.date')='${date}' AND JSON_EXTRACT(attend,'$.time')='${time}'` ;
    db.query(sql,(err,rest)=>{
        if(err){console.log('error in rendering class data')}
        else{
            var mainData = JSON.parse(rest[0].attend);
            var SubInfo = Object.values(mainData).splice(0,6)
            var StdInfo = Object.entries(mainData).splice(6)
            res.render(__dirname+'/ejs-files/classInfo.ejs',{SubInfo,StdInfo})
        }
    })
})


// Logout route

app.get('/logout' ,(req,res)=>{
    res.redirect('/')
})

app.listen(1919,()=>{
    console.log("Server is listing...")
})