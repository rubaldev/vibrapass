const mysql = require('mysql2');
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'vibrachat',
    connectTimeout: 10000,
})
connection.connect((err) => {
    if (err) {
        console.error('erreur de connexion: ' + err.stack);
        return;
    }
    console.log('connecté en tant que ID' + connection.threadId);
});


const selectAll = () => {
    return new Promise((resolve, reject) => {
        connection.query('select *  from user', (err, results) => {
            if (err) {
                return reject(err)
            }
            resolve(results);
        });
    });
};
const insertIntoDb = (name, secondname, christname, email, password, sexe) => {
    return new Promise((resolve, reject) => {
        var request = `INSERT INTO user(name_user,second_name,christ_name,email,password,sexe) VALUES('${name}', '${secondname}', '${christname}', '${email}', '${password}','${sexe}')`;
        connection.query(request, (err, results) => {
            if (err) {
                console.log("une erreur s'est produite", err);
                reject(false);
            } else {
                console.log("envoi reuçu!!");
                resolve(results);
            }
        });
    });
};
const verifyUser = async (email, password) => {
    var request = `SELECT * FROM user WHERE email = '${email}' AND password = '${password}'`;
    return new Promise((resolve, reject) => {
        connection.query(request, (err, results) => {
            if (err) {
                reject(results)
                console.log(err);
            }
            else {
                resolve(results);
                console.log(results);
                
            }
        })
    })

};
/*
const getIdentity = (email, password) => {
    const request = `SELECT name_user,second_name WHERE email ='${email}' AND password = '${password}'`;
    return new Promise((resolve, reject) => {
        connection.query(request, (err, results) => {
            if (err) {
                reject(err)
            } else {
                resolve(results)
            }
        })
    })
}*/
const deleteUser = (email, password) => {
    const request = `DELETE FROM user WHERE email = '${email}' AND password = '${password}'`
    return new Promise((resolve, reject) => {
        connection.query(request, (err, results) => {
            if (err) {
                console.log(err);
                reject(false)
            }
            else {
                resolve(true)
            }
        })
    })
}
const getPassWord = (id_user = 2) => {
    const request = `SELECT * FROM template where id_user = '${id_user}'`;
    return new Promise((resolve, reject) => {
        connection.query(request, (err, results) => {
            if (err) {
                console.log(err)
                reject(false)
            } else {
                resolve(results)
            }
        })
    })
}
const insertUserTemplate = (email, website, category, passwordsite, id_user) => {
        const request = `INSERT INTO template(email,website,category,passwordsite,id_user) VALUES('${email}','${website}','${category}','${passwordsite}','${id_user}')`
        return new Promise((resolve, reject) => {
            connection.query(request, (err, results) => {
                if (err) {
                    reject(false)
                    console.log(err)
                } else {
                    resolve(true)
                }
            })
        })
    } 
    
module.exports = {
    selectAll,
    insertIntoDb,
    verifyUser,
    //getIdentity,
    deleteUser,
    getPassWord,
    insertUserTemplate
}
