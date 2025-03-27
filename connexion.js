const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

require('dotenv').config();
//connexion à la base de données 
const db = new sqlite3.Database('./vibrapass.db', (err) => {
    if (err) {
        console.error('Erreur lors de la connexion à la base de données:', err.message);
    }
    else {
        console.log('Connecté à la base de données SQLite. ');
    }
})

// Méthode pour la création de la table user
const createTableUser = () => {
    const sql1 = `CREATE TABLE IF NOT EXISTS user(
        id_user INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        secondname TEXT NOT NULL,
        christname TEXT NOT NULL,
        email TEXT NOT NULL,
        password TEXT NOT NULL,
        sexe TEXT NOT NULL
    );`;
    db.run(sql1, (err) => {
        if (err) {
            console.log('Erreur lors de la création de la table user:', err.message);
        } else {
            console.log('Table user créée ou déjà existante.');
        }
    });
};

// Méthode pour la création de la table template
const createTableTemplate = () => {
    const sql = `CREATE TABLE IF NOT EXISTS template(
        id_template INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL,
        website TEXT NOT NULL,
        category TEXT NOT NULL,
        passwordsite TEXT NOT NULL,
        id_user INTEGER,
        FOREIGN KEY(id_user) REFERENCES user(id_user) ON DELETE CASCADE
    );`;
    db.run(sql, (err) => {
        if (err) {
            console.log('Erreur lors de la création de la table template:', err.message);
        } else {
            console.log('Table template créée ou déjà existante.');
        }
    });
};

const selectAll = () => {
    return new Promise((resolve, reject) => {
        const request = `SELECT website, COUNT(*) as user_count FROM template GROUP BY website`;
        db.all(request, (err, rows) => {
            if (err) {
                return reject(err);
            }
            resolve(rows);
        });
    });
};

const insertIntoDb = (name, secondname, christname, email, password, sexe) => {
    return new Promise((resolve, reject) => {
        bcrypt.hash(password, 10, function (err, hash) {
            if (err) {
                console.log('erreur lors du hashage de mot de passe', err);
                return;
            }
            password = hash;
            const request = `INSERT INTO user(name, secondname, christname, email, password, sexe) 
                 VALUES(?, ?, ?, ?, ?, ?)`;

            db.run(request, [name, secondname, christname, email, password, sexe], function (err) {
                if (err) {
                    console.log("une erreur s'est produite", err);
                    reject(false);
                } else {
                    console.log("envoi reçu!! status:",this.lastID);
                    resolve(this);
                }
            });
        });
    });
};

const verifyUser = (email, password) => {
    try {
        const request = `SELECT * FROM user WHERE email = ?`;
        return new Promise((resolve, reject) => {
            db.get(request, [email], (err, row) => {
                if (err) {
                    reject(err);
                    console.log('erreur lors de la verification dans la base de données', err);
                } else {
                    bcrypt.compare(password, row.password, function (err, result) {
                        if (err) {
                            console.log('Erreur lors de la comparaison', err);
                        } else {
                            console.log(result);
                            resolve(result ? row : null);
                        }
                    });
                }
            });
        });
    } catch (error) {
        console.log('erreur', error);
        return Promise.reject(error);
    }
};

const deleteUser = (email) => {
    const request = `DELETE FROM user WHERE email = ?`;
    return new Promise((resolve, reject) => {
        db.run(request, [email], function (err) {
            if (err) {
                console.log(err);
                reject(false);
            } else {
                resolve(true);
            }
        });
    });
};

const getPassWord = (id_user) => {
    const request = `SELECT * FROM template WHERE id_user = ?`;
    return new Promise((resolve, reject) => {
        db.all(request, [id_user], (err, rows) => {
            if (err) {
                console.log(err);
                reject(false);
            } else {
                resolve(rows);
                
            }
        });
    });
};

const insertUserTemplate = (email, website, category, passwordsite, id_user) => {
    return new Promise((resolve, reject) => {
        const request = `INSERT INTO template(email, website, category, passwordsite, id_user) 
                         VALUES(?, ?, ?, ?, ?)`;
        db.run(request, [email, website, category, passwordsite, id_user], function (err,RunResult) {
            if (err) {
                reject(false);
            } else {
                console.log(RunResult);
                resolve(true);
            }
        });
    });
};

const verifyUserEmail = (email) => {
    const request = `SELECT email FROM user WHERE email = ?`;
    return new Promise((resolve, reject) => {
        db.get(request, [email], (error, row) => {
            if (error) {
                reject(false);
            } else {
                resolve(row ? true : false);
            }
        });
    });
};

const verifyPassEmail = (email, password, website) => {
    const request = `SELECT email FROM template WHERE email = ? AND passwordsite = ? AND website = ?`;
    return new Promise((resolve, reject) => {
        db.get(request, [email, password, website], (error, row) => {
            if (error) {
                reject(false);
            } else {
                resolve(row ? true : false);
            }
        });
    });
};

const deconnexion = (session) => {
    if (session) {
        session.destroy((err) => {
            if (err) throw err;
            return true;
        });
    }
};

const setPassWord = (password, email) => {
    return new Promise((resolve, reject) => {
        bcrypt.hash(password, 10, function (err, hash) {
            if (err) {
                console.log('erreur lors du hashage de mot de passe', err);
                return;
            }
            password = hash;
            const request = `UPDATE user SET password = ? WHERE email = ?`;
            db.run(request, [password, email], function (err) {
                if (err) {
                    console.log(err);
                    reject(false);
                } else {
                    resolve(true);
                }
            });
        });
    });
};

const sendMailToken = async (token, email) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: "vibraniumrdc@gmail.com",
                pass: "yfxtcyydrmmhyznc",
            },
        });
        const resetLink = `http://192.168.43.103:3000/reset?token='${token}'`;
        try {
            const info = await transporter.sendMail({
                from: 'vibraniumrdc@gmail.com',
                to: email,
                subject: 'Renitialisation du mot de passe',
                text: `Cliquez sur ce lien pour réinitialiser votre mot de passe:${resetLink}`,
            });
            console.log("Email envoyé");
            return true;
        } catch (error) {
            throw error;
        }
    } catch (error) {
        console.log('une erreur s\'est produite');
        return false;
    }
};

const modifPassTemplate = (oldpassword, newpassword, email, website) => {
    return new Promise((resolve, reject) => {
        const request = `UPDATE template SET passwordsite = ? WHERE email = ? AND passwordsite = ? AND website = ?`;
        db.run(request, [newpassword, email, oldpassword, website], function (err) {
            if (err) {
                console.log(err);
                reject(false);
            } else {
                resolve(true);
            }
        });
    });
};

const deletePassTemplate = (email, oldpassword, website) => {
    return new Promise((resolve, reject) => {
        const request = `DELETE FROM template WHERE email = ? AND passwordsite = ? AND website = ?`;
        db.run(request, [email, oldpassword, website], function (err) {
            if (err) {
                console.log(err);
                reject(false);
            } else {
                console.log("Suppression réussie");
                resolve(true);
            }
        });
    });
};


const checkTableStructure = (user) => {
    db.all(`PRAGMA table_info('${user}');`, [], (err, rows) => {
        if (err) {
            console.error("Erreur lors de la récupération des informations de la table:", err);
        } else {
            console.log(`Colonnes de la table '${user}':`, rows);
        }
    });
};
const checkTableContent = (user) => {
    db.all(`SELECT * FROM('${user}');`, [], (err, rows) => {
        if (err) {
            console.error("Erreur lors de la récupération des informations de la table:", err);
        } else {
            console.log(`le resultat de la table '${user}':`, rows);
        }
    });
};



module.exports = {
    checkTableContent,
    checkTableStructure,
    createTableUser,
    createTableTemplate,
    deletePassTemplate,
    selectAll,
    insertIntoDb,
    verifyUser,
    deleteUser,
    getPassWord,
    insertUserTemplate,
    verifyUserEmail,
    setPassWord,
    deconnexion,
    sendMailToken,
    verifyPassEmail,
    modifPassTemplate,
}
