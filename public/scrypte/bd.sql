DROP DATABASE vibrachat;
create DATABASE vibrachat;

use vibrachat;
create table user(id_user int primary key auto_increment,
name_user varchar(30) NOT NULL,
second_name varchar(30) NOT NULL,
christ_name varchar(30) NOT NULL,
email varchar(500) NOT NULL UNIQUE,
password varchar(200) NOT NULL,
sexe char(1))engine=innoDB;
describe user;

create table template(id_template int primary key auto_increment,
email varchar(30),
website varchar(100) NOT NULL,
category varchar(30),
passwordsite varchar(30) NOT NULL,
id_user int,
foreign key(id_user) references user(id_user)
)engine=innoDB;
describe template;
/*
create table message(id_message int primary key auto_increment,
id_user_send int,
message varchar(500),
id_user_recever int,
foreign key(id_user_send) references user(id_user),
foreign key(id_user_recever) references user(id_user))engine=innoDB;
describe message;
*/