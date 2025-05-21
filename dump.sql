PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                first_name TEXT,
                last_name TEXT,
                email TEXT,
                role TEXT DEFAULT 'user',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
INSERT INTO users VALUES(1,'johndoe','$2b$10$dRquW0ccLUmfurFtcMHytOvB4gQvSZP2mnBQiRU7rUDrPxjhZNAJm','John','Doe','john.doe@example.com','user','2025-04-11 10:28:32','2025-04-11 10:28:32');
INSERT INTO users VALUES(2,'testuser','$2b$10$CZOJEn4btfaG5k1qJ/uJxO4qJZRhiDIIvam7lNhnMwsJpku4Vvu5i','Test','User','test@example.com','user','2025-04-18 16:20:25','2025-04-18 16:20:25');
INSERT INTO users VALUES(3,'testuser2','$2b$10$nZOQ9wU/GTHVFEMWtTnHiuD6rHum8sq2xBQKGOv58GVkeSx2SOezO','Test','User','test2@example.com','user','2025-04-18 16:53:09','2025-04-18 16:53:09');
INSERT INTO users VALUES(4,'testuser123','$2b$10$201ZraNHWs2JszJmvVjnGuTyGYJzGK03f/E3TOpsM686LB6Mg9n5m','Test','User','test123@example.com','user','2025-05-02 11:55:05','2025-05-02 11:55:05');
INSERT INTO users VALUES(5,'user_6633b7a75c9e925d','$2b$10$oxxC8g.e9HaFx1IIeAS8zeB5f4BruZfc9ToQcJyygAl9.m0VKE3e.','Test','User','user_6633b7a75c9e925d@example.com','user','2025-05-16 06:58:36','2025-05-16 06:58:36');
INSERT INTO users VALUES(6,'testuser_$(date +%s)','$2b$10$Ssaylo5uVwU.GTGdhtceHeRm/8zF/47oWeB3FeoMB7IFpiu/69p26','Test','User','test_unique@example.com','user','2025-05-16 07:04:35','2025-05-16 07:04:35');
INSERT INTO users VALUES(7,'testuser_1684220726','$2b$10$jvQnZIaVDfTLmbA5jzw1OehG9qo7lJKQO4VHHb7xldom0hLgyj2jK','Test','User','test_unique2@example.com','user','2025-05-16 07:05:36','2025-05-16 07:05:36');
INSERT INTO users VALUES(8,'user_ad397044e2ddcfc1','$2b$10$8vidlVegO8PM.xtnWd19v.cNdr19c8IQE7JeaWfhPybNTDtxInmQ2','Test','User','user_ad397044e2ddcfc1@example.com','user','2025-05-16 07:26:16','2025-05-16 07:26:16');
INSERT INTO users VALUES(9,'user_fcfac64b58b0bcae','$2b$10$ADEGqsOgqZ7tO7jV6cP1fOQ.JT9BaskN/uinhzib4LNRg1Ong1yeK','Test','User','user_fcfac64b58b0bcae@example.com','user','2025-05-16 07:56:11','2025-05-16 07:56:11');
INSERT INTO users VALUES(10,'user_7b5d5f593b6a0102','$2b$10$LlGGHWPGJ.BZ3tyEqAMwVuKAbbQJBQmVtpqVM3RpoOlwqrHlxvSi2','Test','User','user_7b5d5f593b6a0102@example.com','user','2025-05-16 08:03:31','2025-05-16 08:03:31');
INSERT INTO users VALUES(11,'user_231917fae4974579','$2b$10$Ka7dmh/kAwaoa7U0tvRDROUV3C2Fny93XoNigHcF/norvMDlWs7Ei','Test','User','user_231917fae4974579@example.com','user','2025-05-16 08:08:32','2025-05-16 08:08:32');
INSERT INTO users VALUES(12,'user_2c3e130d8c83c12a','$2b$10$zrCRSmHuGQR6.OF9KVf6T.JXLf7OdhPgdkcMmolovaYTnh66YgdB.','Test','User','user_2c3e130d8c83c12a@example.com','user','2025-05-16 08:20:51','2025-05-16 08:20:51');
INSERT INTO users VALUES(13,'user_08bf0e638bf17850','$2b$10$UpfEKINVBmaCxsmJ78TMsuM7g/BqYfiVn9/mHuwpoeuOJz54tyGJi','Test','User','user_08bf0e638bf17850@example.com','user','2025-05-16 08:25:44','2025-05-16 08:25:44');
INSERT INTO users VALUES(14,'user_8d391eb0d1358a76','$2b$10$8AEloyT6tveqQLTLyHEbDOepUjgvdGZ3OBTmwl4ch7gQOgKD9kSlW','Test','User','user_8d391eb0d1358a76@example.com','user','2025-05-16 08:35:20','2025-05-16 08:35:20');
INSERT INTO users VALUES(15,'user_36d70afb95d62991','$2b$10$C0luL4uGj0DpCSBBbAIGv.VdvWhlmzB1vqzec0MzPo8KeKZWBCbdW','Test','User','user_36d70afb95d62991@example.com','user','2025-05-16 08:39:44','2025-05-16 08:39:44');
INSERT INTO users VALUES(16,'user_ceaa323211ac9c19','$2b$10$Xtbz/nG.a4duVice4/Q9ReTe66Cb6JUAdhFFcZ4L0ekCcIjTGnPUq','Test','User','user_ceaa323211ac9c19@example.com','user','2025-05-16 08:44:01','2025-05-16 08:44:01');
INSERT INTO users VALUES(17,'user_1f816e27877fa1de','$2b$10$Osi00NMKgznxy/GfKEpVu.sLrc3.DiLPosQiUdoCYVGg3KUhl9xxm','Test','User','user_1f816e27877fa1de@example.com','user','2025-05-16 08:47:31','2025-05-16 08:47:31');
INSERT INTO users VALUES(18,'user_ace59697f9c61117','$2b$10$2wSY.Ll539VvoZT1rtQbU.WWsZuI4xNRdDCSJIkR51wyHI2yabOCC','Test','User','user_ace59697f9c61117@example.com','user','2025-05-16 08:49:16','2025-05-16 08:49:16');
INSERT INTO users VALUES(19,'user_0b48a5602db00235','$2b$10$k.iclpJ6q85FHT.wbHVP8OoJXGwAyPWs279kWMmgsx/tStHJ9hf3u','Test','User','user_0b48a5602db00235@example.com','user','2025-05-16 08:51:13','2025-05-16 08:51:13');
INSERT INTO users VALUES(20,'user_3be7bd07d5dc4e76','$2b$10$fVfHMSslLujYsPND5E3t2.Pg254rdxHjeUm1pmq2ipqltAYoah1Hq','Updated','User','updated@example.com','user','2025-05-16 08:55:15','2025-05-16T08:55:15.539Z');
INSERT INTO users VALUES(21,'user_eb1acd8222e0d807','$2b$10$wCpCXBbWWfelXF892k0dTeKC6gLrvQ5Rh.LAayeeDOpWetn8qUMfW','Updated','User','updated@example.com','user','2025-05-16 09:00:25','2025-05-16T09:00:25.684Z');
INSERT INTO users VALUES(22,'user_a6cff64b0c273194','$2b$10$npEFojvtoXRcqriQSCurbuJj0KeNa5xLLFCKPfAa85dMQYmZiXauO','Updated','User','updated@example.com','user','2025-05-16 09:03:44','2025-05-16T09:03:44.663Z');
INSERT INTO users VALUES(23,'user_9646ff87e1b7faf5','$2b$10$6hnQlAIXy.t/FSo.5gO7yOsGjrzn0ajQOAA7P0Va2a.UE4WfLOzma','Updated','User','updated@example.com','user','2025-05-16 09:07:20','2025-05-16T09:07:20.451Z');
INSERT INTO users VALUES(24,'user_dafc392b6be6d03c','$2b$10$1hsUNmbafx6HfQ3BLO6F3.tjIgIYf/ulrDQuwhvnSImg/cAIKT.yy','Updated','User','updated@example.com','user','2025-05-16 09:07:35','2025-05-16T09:07:35.760Z');
INSERT INTO users VALUES(25,'user_fc0bc482c1062e46','$2b$10$k4EKOH3l2XP96HUH0d2lwu5MKaRnxyidwFiDU7RhXbY9RHS1BhdxK','Updated','User','updated@example.com','user','2025-05-16 09:10:22','2025-05-16T09:10:23.108Z');
INSERT INTO users VALUES(26,'user_16eee17c10d3080b','$2b$10$fOHlDr4E.ilbvQR/t5CxP.WL9Wjrtu4KTUhaXXBWvz0gMJHY4K1VC','Updated','User','updated@example.com','user','2025-05-16 09:11:34','2025-05-16T09:11:34.560Z');
INSERT INTO users VALUES(27,'user_16c9e1ee665c0a4a','$2b$10$hI0V8eD6asNkh73IlFHMdeTz/NNYu5IDCJyPj/f5kJM.uMDbO/AaS','Updated','User','updated@example.com','user','2025-05-16 09:15:47','2025-05-16T09:15:47.481Z');
INSERT INTO users VALUES(28,'user_df6dcbf76e3886b0','$2b$10$ArYP/rxFoSlLtMIr7Juoz.4ZhYUd5yaESut/df0Xbdiehm298h6TG','Updated','User','updated@example.com','user','2025-05-16 09:18:34','2025-05-16T09:18:34.773Z');
INSERT INTO users VALUES(29,'user_0d850011dfecdb68','$2b$10$9bDMbG8d/4iqTakpoWDN1uItQrbYA8OUSRjvO/9HZPmCU9EB93VY6','Updated','User','updated@example.com','user','2025-05-16 09:19:45','2025-05-16T09:19:45.938Z');
INSERT INTO users VALUES(30,'user_d2793ddd3e7c8de4','$2b$10$r8.CjdrRnw30aN7E8CsKl.686aKgPny2buDlujB53gGHtuRF9gEIm','Updated','User','updated@example.com','user','2025-05-16 09:31:59','2025-05-16T09:31:59.535Z');
INSERT INTO users VALUES(31,'user_1e7fa5901f1c8c07','$2b$10$6su5vkkqxGVnmdozotY0cu9ikxoAa1/3ibmPO3lmPV03RMBtqb/ie','Updated','User','updated@example.com','user','2025-05-16 09:34:30','2025-05-16T09:34:30.401Z');
INSERT INTO users VALUES(32,'user_66663bf3df6ad4f2','$2b$10$tjKVAKx6LLAPHYaVnQKIXOGKGV5qxubJXcEDd5JIOHwD1sPYx0JWi','Updated','User','updated@example.com','user','2025-05-16 09:36:37','2025-05-16T09:36:38.276Z');
INSERT INTO users VALUES(33,'user_bed23ff53a6bf4f8','$2b$10$uwFfEtnElBjZFJIEDgaoxuq//NikVwhAPoZYUj86zIryUqEdLcLlO','Updated','User','updated@example.com','user','2025-05-16 09:48:02','2025-05-16T09:48:03.203Z');
INSERT INTO users VALUES(34,'user_c6e94d5ce92e9b1c','$2b$10$H7Sa/D1HWScI0m63L6EDpuh7lizyOAI74UpiYviKMioc5Zl.VcqSq','Updated','User','updated@example.com','user','2025-05-16 10:03:47','2025-05-16T10:03:47.683Z');
INSERT INTO users VALUES(35,'user_a03cc6997368cb56','$2b$10$Ys..gWFq3eVupgbm3tNGBecT0KROvsfqDWBKaWEn.V.iNgvsi9yPO','Updated','User','updated@example.com','user','2025-05-16 10:57:16','2025-05-16T10:57:17.233Z');
INSERT INTO users VALUES(36,'user_9bd15fbe74f167e5','$2b$10$j4sxP6GL5PnEniMl6.ImYuVcb/4p/Cr4VXG6aMEMdVP2/X7bIhXpK','Updated','User','updated@example.com','user','2025-05-16 10:57:57','2025-05-16T10:57:58.268Z');
INSERT INTO users VALUES(37,'user_7f7ec1430ba29e84','$2b$10$3OBwWxm/qB/CQBtdzPx71.UKgRC21oTPBwUV9SLBIKri0dtUe.pbu','Updated','User','updated@example.com','user','2025-05-16 11:13:11','2025-05-16T11:13:12.118Z');
INSERT INTO users VALUES(38,'testuser3','$2b$10$benDrzUatgKRXN6ddh9lcOlC3scuOHwcTc4JjCdRLBKcThFOypu9u','Test','User','test3@example.com','user','2025-05-16 11:19:24','2025-05-16 11:19:24');
INSERT INTO users VALUES(39,'testuser_1747408546992','$2b$10$x2q/NAJ/jIszsGoLw.2d0OzSuiMe97cF/UWLPfI1DKvP8easMceyy','John','Doe','testuser_1747408546992@example.com','user','2025-05-16 15:15:47','2025-05-16 15:15:47');
INSERT INTO users VALUES(40,'testuser_1747408641233','$2b$10$wpYbF2t/NwtUJ49oFDoGm.8azIQk4SkhvtOglxiwl501lD2Tq/ABS','John','Doe','testuser_1747408641233@example.com','user','2025-05-16 15:17:21','2025-05-16 15:17:21');
INSERT INTO users VALUES(41,'testuser_1747409118655','$2b$10$GGInjrgG7iy9xfCK1anNfu7YpQukJBsJm/fLBylGpjWu7uINos2X.','John','Doe','testuser_1747409118655@example.com','user','2025-05-16 15:25:18','2025-05-16 15:25:18');
INSERT INTO users VALUES(42,'testuser_1747409220510','$2b$10$sH4u7CwbJH1wvPx1IEgIBum0NzSKWpSjMrvLBb9tiqZ4KMmWSV3Ia','John','Doe','testuser_1747409220510@example.com','user','2025-05-16 15:27:00','2025-05-16 15:27:00');
INSERT INTO users VALUES(43,'testuser_1747409330825','$2b$10$U8b/WMMdX8QyyZB04mZzvOUbt6LSNFXuD2Z2d0nTiu5CbPenUGD/u','John','Doe','testuser_1747409330825@example.com','user','2025-05-16 15:28:50','2025-05-16 15:28:50');
INSERT INTO users VALUES(44,'testuser_1747465658506','$2b$10$mvZwNW6QX.1WovnajXXDB.IdQvNjtHR3wNRy60dzAJp.UgYk/ZyIO','John','Doe','testuser_1747465658506@example.com','user','2025-05-17 07:07:38','2025-05-17 07:07:38');
INSERT INTO users VALUES(45,'testuser_1747465989272','$2b$10$b2Vg90qSEowB2lolkIJNX.a10GnS3DSowq9B1Mg3yXAW8Fx8ypZs2','John','Doe','testuser_1747465989272@example.com','user','2025-05-17 07:13:09','2025-05-17 07:13:09');
INSERT INTO users VALUES(46,'testuser_1747466251074','$2b$10$BadCZyXNYimAgOgWsddLXOWV7YoWxbBUD8qfiCLGkULUwcyPvz4Bi','John','Doe','testuser_1747466251074@example.com','user','2025-05-17 07:17:31','2025-05-17 07:17:31');
INSERT INTO users VALUES(47,'testuser_1747466558367','$2b$10$/rQjp8GuHhVHq5pF/k5k7e95daGo/SG9EbQvWJBKdbWj5Llps1G4i','John','Doe','testuser_1747466558367@example.com','user','2025-05-17 07:22:38','2025-05-17 07:22:38');
INSERT INTO users VALUES(48,'testuser_1747466587107','$2b$10$J/VUkmQUZXmdoqIRBpItn.WviFWu7kBGuUMjo2fbQAfTLfC9LnbdW','John','Doe','testuser_1747466587107@example.com','user','2025-05-17 07:23:07','2025-05-17 07:23:07');
INSERT INTO users VALUES(49,'testuser_1747467262029','$2b$10$svAswYLBHAgCoxXOZGiC1uE.ZoVq0iV43PI0kIJyesQawDBNJjrCK','John','Doe','testuser_1747467262029@example.com','user','2025-05-17 07:34:22','2025-05-17 07:34:22');
INSERT INTO users VALUES(50,'testuser_1747467319085','$2b$10$cZc0fe8cBb4iBleGQtxjOut16R3XFNZKCRPx1oP28zc4Cy444mvRm','John','Doe','testuser_1747467319085@example.com','user','2025-05-17 07:35:19','2025-05-17 07:35:19');
INSERT INTO users VALUES(51,'testuser_1747467359680','$2b$10$vTq6VE0jBZUYTjcoAju/q.YywzrpMBv7kfCYd9qx/R6qjm5.jgqFO','John','Doe','testuser_1747467359680@example.com','user','2025-05-17 07:35:59','2025-05-17 07:35:59');
INSERT INTO users VALUES(52,'testuser_1747467607464','$2b$10$FSYW2tvj9BFXuplv8iamMeDJGYPxC6cTvrbObDAIb0NYXYPIwYfhq','John','Doe','testuser_1747467607464@example.com','user','2025-05-17 07:40:07','2025-05-17 07:40:07');
INSERT INTO users VALUES(53,'testuser_1747467660339','$2b$10$RNP9QHhhnsJa2gMwbdtpF.pWSXQgIZIrpyQuxnUKVVKbtbcyLZs8a','John','Doe','testuser_1747467660339@example.com','user','2025-05-17 07:41:00','2025-05-17 07:41:00');
INSERT INTO users VALUES(54,'testuser_1747467741796','$2b$10$KMtq.bz49NOLDGXC641V1O.8OEI6jTE8WN7fUnh1SFQmMuVniEs9.','John','Doe','testuser_1747467741796@example.com','user','2025-05-17 07:42:21','2025-05-17 07:42:21');
INSERT INTO users VALUES(55,'testuser_1747467779977','$2b$10$4/yc7Iut/oaWBmqu1faCIOhR2jYyFH6bI7DbVpqAuxEB2.WA5CtU2','John','Doe','testuser_1747467779977@example.com','user','2025-05-17 07:43:00','2025-05-17 07:43:00');
INSERT INTO users VALUES(56,'testuser_1747468091380','$2b$10$ToBgq5cxkAvW.vRHb8tPGOWPCsCEbErzdBPNXbm2Y.ZCkesUlUK3G','John','Doe','testuser_1747468091380@example.com','user','2025-05-17 07:48:11','2025-05-17 07:48:11');
INSERT INTO users VALUES(57,'testuser_1747469883664','$2b$10$HrGKAJgwDUPFVgSgaZzf.uXKB3KJ93LMf5lf0w7j9yH3WTCXveNr.','John','Doe','testuser_1747469883664@example.com','user','2025-05-17 08:18:03','2025-05-17 08:18:03');
INSERT INTO users VALUES(58,'testuser_1747470267502','$2b$10$rO9FF/OU/R3RmiNuGD0c2OWiNiWG3lS9gUPwjFmoD5/Gkl6o0VoSS','John','Doe','testuser_1747470267502@example.com','user','2025-05-17 08:24:27','2025-05-17 08:24:27');
INSERT INTO users VALUES(59,'testuser_1747470333879','$2b$10$tEQSJlLm78sG7Qihe3zyFugLf193JvzmOcU6mgUhUipoaiMrZqFQ2','John','Doe','testuser_1747470333879@example.com','user','2025-05-17 08:25:33','2025-05-17 08:25:33');
INSERT INTO users VALUES(60,'testuser_1747551438236','$2b$10$/iC6f0Icv1i9nHDd4K6ACuUL2wslGGosWTn4OFj5umI65eHgQPQxm','John','Doe','testuser_1747551438236@example.com','user','2025-05-18 06:57:18','2025-05-18 06:57:18');
INSERT INTO users VALUES(61,'testuser_1747551683883','$2b$10$hhagtl7ceAaAFtIdbTdyjuUN7EpEMQH07xGR.vVm8fOw3xVtIFiSC','John','Doe','testuser_1747551683883@example.com','user','2025-05-18 07:01:23','2025-05-18 07:01:23');
INSERT INTO users VALUES(62,'testuser_1747563566033','$2b$10$m/R7O/5QukFToP8.SJI5HePF77vyVKL2bBZMzaaCnSNG3.BYychEC','John','Doe','testuser_1747563566033@example.com','user','2025-05-18 10:19:26','2025-05-18 10:19:26');
INSERT INTO users VALUES(63,'testuser_1747564168339','$2b$10$5Jbi58A46uqocoZhYU62auq52BYyMsgsne61aXVAHx0tYCy8vv3Hu','John','Doe','testuser_1747564168339@example.com','user','2025-05-18 10:29:28','2025-05-18 10:29:28');
INSERT INTO users VALUES(64,'testuser_1747585045759','$2b$10$Iu9wEcEi.7ewjs5SKufDf.3grUnab8/EdksF3I00GD587v0v7pSZC','John','Doe','testuser_1747585045759@example.com','user','2025-05-18T16:17:25.845Z','2025-05-18T16:17:25.845Z');
INSERT INTO users VALUES(65,'testuser_1747585609191','$2b$10$5Me4Jxh/apYLbkzHAr0F5OL4HCKy3N1Zd/0uuJ9939vZHL2ckOzIG','John','Doe','testuser_1747585609191@example.com','user','2025-05-18T16:26:49.280Z','2025-05-18T16:26:49.280Z');
INSERT INTO users VALUES(66,'testuser_1747585717457','$2b$10$ndxFK7G2GFqyBw5o3E/5JOSq7lDOIk3uBfOIVDZIUJW2Na1YKvmki','John','Doe','testuser_1747585717457@example.com','user','2025-05-18T16:28:37.545Z','2025-05-18T16:28:37.545Z');
INSERT INTO users VALUES(67,'testuser_1747586486002','$2b$10$S.f8Z7e4wTWL6munjtY.1eXVeC5d.0OwDhGhDaEBOvvQKeB.PsfoO','John','Doe','testuser_1747586486002@example.com','user','2025-05-18T16:41:26.092Z','2025-05-18T16:41:26.092Z');
INSERT INTO users VALUES(68,'testuser_1747587279239','$2b$10$./p7xLpcKhYHBcGsMFge.esxbsAdybJLcSbVsCVAE7FEREL0teLDm','John','Doe','testuser_1747587279239@example.com','user','2025-05-18T16:54:39.328Z','2025-05-18T16:54:39.328Z');
INSERT INTO users VALUES(69,'testuser_1747587541000','$2b$10$25UOVEpC0jHpo.ufHJcRzOr5GikdsKomlufYrTGOeDH.gXW.zfIzK','John','Doe','testuser_1747587541000@example.com','user','2025-05-18T16:59:01.088Z','2025-05-18T16:59:01.088Z');
INSERT INTO users VALUES(70,'testuser_1747587563765','$2b$10$3zoXoXNuieDW88ab5mTew.uTGyEZKIzHWGmxTQsmp7ZSNiw/5g0j6','John','Doe','testuser_1747587563765@example.com','user','2025-05-18T16:59:23.852Z','2025-05-18T16:59:23.852Z');
INSERT INTO users VALUES(71,'testuser_1747588148330','$2b$10$r8XTlCq58tm/en8DYPmaGOY3xOo043wu.4NK5CMp9NGaOFrVM3iLa','John','Doe','testuser_1747588148330@example.com','user','2025-05-18T17:09:08.416Z','2025-05-18T17:09:08.416Z');
INSERT INTO users VALUES(72,'testuser_1747589460986','$2b$10$WnCQt0VoP1ZFm3.Cl7wgreTboFcxvnXBiytc6NyksMvP27PQbVFku','John','Doe','testuser_1747589460986@example.com','user','2025-05-18T17:31:01.073Z','2025-05-18T17:31:01.073Z');
INSERT INTO users VALUES(73,'testuser_1747589735242','$2b$10$pGGFBCedLGz7wi8z033PYOQNnvQD0O2P3UYvYIcTdZDHcfIwCu/KO','John','Doe','testuser_1747589735242@example.com','user','2025-05-18T17:35:35.327Z','2025-05-18T17:35:35.327Z');
INSERT INTO users VALUES(74,'testuser_1747589793994','$2b$10$/Quu3zW90SpiZpfKhaTwg.gBS1rf4RbBjr3zp2a3LWo/gG5duhM1q','John','Doe','testuser_1747589793994@example.com','user','2025-05-18T17:36:34.083Z','2025-05-18T17:36:34.083Z');
INSERT INTO users VALUES(75,'testuser_1747589844401','$2b$10$RmedWXRXzmR44NGfm38a8O3EKSpr.gTYboFQkRFgtqloHja6k5jc6','John','Doe','testuser_1747589844401@example.com','user','2025-05-18T17:37:24.488Z','2025-05-18T17:37:24.488Z');
INSERT INTO users VALUES(76,'testuser_1747639156278','$2b$10$KqqpPa7ej6zOyvyeOl7Z/e40FkABTAN8jKycXfJ17voysDfy9ehL6','John','Doe','testuser_1747639156278@example.com','user','2025-05-19T07:19:16.363Z','2025-05-19T07:19:16.363Z');
INSERT INTO users VALUES(77,'testuser_1747639275784','$2b$10$RzGcGMsu3PM7nACFY41hHOivvAUMW9m4JsVSQyQYH7ZEUR2zJRnGS','John','Doe','testuser_1747639275784@example.com','user','2025-05-19T07:21:15.869Z','2025-05-19T07:21:15.869Z');
INSERT INTO users VALUES(78,'testuser_1747639385352','$2b$10$ftkWqU3RtQDKP.zHNu6AQuTm3xh/JsiEAxbi4WXXLWTwhGJM35.MS','John','Doe','testuser_1747639385352@example.com','user','2025-05-19T07:23:05.439Z','2025-05-19T07:23:05.439Z');
INSERT INTO users VALUES(79,'testuser_1747639658350','$2b$10$tQKRuIYKSHp3ExLX.H8ErejcXBt1Z6gkB.pLOmIQfWBYRHwfg/KMy','John','Doe','testuser_1747639658350@example.com','user','2025-05-19T07:27:38.436Z','2025-05-19T07:27:38.436Z');
INSERT INTO users VALUES(80,'testuser_1747639773749','$2b$10$m2q6mYYNbhS6vGWppHiKbetKvn/MZIZpZ4TP4Tm0UZSx4mzJXy3y.','John','Doe','testuser_1747639773749@example.com','user','2025-05-19T07:29:33.858Z','2025-05-19T07:29:33.858Z');
INSERT INTO users VALUES(81,'testuser_1747640167406','$2b$10$i8kY5sJH/lm/W2RDEvaCieqv5Tv8RymzVXpbXLxE6nLr/fPypvlw2','John','Doe','testuser_1747640167406@example.com','user','2025-05-19T07:36:07.495Z','2025-05-19T07:36:07.495Z');
INSERT INTO users VALUES(82,'testuser_1747640455600','$2b$10$9W57iJ6PO7FBPOhv76tKUObKan1QEFC8QgSfqnng69hivMNjoQ4qy','John','Doe','testuser_1747640455600@example.com','user','2025-05-19T07:40:55.686Z','2025-05-19T07:40:55.686Z');
INSERT INTO users VALUES(83,'testuser_1747640544440','$2b$10$xzq8.KuOChJE.iBRdx/bb.V3wMf4.mEkoZIP4YdEezPUIeDGAatjW','John','Doe','testuser_1747640544440@example.com','user','2025-05-19T07:42:24.526Z','2025-05-19T07:42:24.526Z');
INSERT INTO users VALUES(84,'testuser_1747646363653','$2b$10$arDPNy3dNUl2M3YgzibuoOZaoyzqH4krlMniJP9AnqtAjFNyqc4l6','John','Doe','testuser_1747646363653@example.com','user','2025-05-19T09:19:23.740Z','2025-05-19T09:19:23.740Z');
INSERT INTO users VALUES(85,'testuser_1747648735102','$2b$10$0zptOQsScbLC.Z9FmQlj1.95mJdUZtoRAvfIaCluxTSTHfGSMT2fa','John','Doe','testuser_1747648735102@example.com','user','2025-05-19T09:58:55.188Z','2025-05-19T09:58:55.188Z');
INSERT INTO users VALUES(86,'testuser_1747650495251','$2b$10$Vzf3EjhcSXaPuQm9gMqk/OMnz/JuBOkJPZOovEA/PlhlFm.QY0MrS','John','Doe','testuser_1747650495251@example.com','user','2025-05-19T10:28:15.337Z','2025-05-19T10:28:15.337Z');
INSERT INTO users VALUES(87,'testuser_1747650570596','$2b$10$9eZlzV16EafVs1sIlVajwOOJG4TJCdEn1rzru9I1e1Lb2S4EPfAsu','John','Doe','testuser_1747650570596@example.com','user','2025-05-19T10:29:30.682Z','2025-05-19T10:29:30.682Z');
INSERT INTO users VALUES(88,'testuser_1747650587262','$2b$10$m06vmnrlh8qWguvW2n3XZOkuP/gN6iJF/HXF02UWpwo2l88RxOTda','John','Doe','testuser_1747650587262@example.com','user','2025-05-19T10:29:47.348Z','2025-05-19T10:29:47.348Z');
INSERT INTO users VALUES(89,'testuser_1747650625664','$2b$10$jpb8QJ6KagvDbRmBDXoebu/cf8rcI9pFqhIEfAKPO2EfFSHz9DQH2','John','Doe','testuser_1747650625664@example.com','user','2025-05-19T10:30:25.751Z','2025-05-19T10:30:25.751Z');
INSERT INTO users VALUES(90,'testuser_1747650668575','$2b$10$kxCmXB3AcJY0qEjfJ6.CZuse4hN1nxfv696H4qqIBdXJPZjghlKeG','John','Doe','testuser_1747650668575@example.com','user','2025-05-19T10:31:08.662Z','2025-05-19T10:31:08.662Z');
INSERT INTO users VALUES(91,'testuser_1747650746153','$2b$10$xMC3mWwHZAk3ATNnD43dXuvQi3UVuDg8gwvzbV65ZtbsP1vFL5s7m','John','Doe','testuser_1747650746153@example.com','user','2025-05-19T10:32:26.226Z','2025-05-19T10:32:26.226Z');
INSERT INTO users VALUES(92,'testuser_1747650776645','$2b$10$10kBfqzKy6sTTeZYVICUQehs9qHrQnAGlY0WpQJZrQWaNhZSuBHi6','John','Doe','testuser_1747650776645@example.com','user','2025-05-19T10:32:56.719Z','2025-05-19T10:32:56.719Z');
INSERT INTO users VALUES(93,'testuser_1747650804325','$2b$10$LiRzD3WjFJ02rdFZ0WOvvexPEzE.UQwavl3uyBkR3XUeyahwrHwjW','John','Doe','testuser_1747650804325@example.com','user','2025-05-19T10:33:24.400Z','2025-05-19T10:33:24.400Z');
INSERT INTO users VALUES(94,'testuser_1747650846601','$2b$10$bD6QQtj10ZEHS4dGDDzKhuaoiHZKCPlXMysNwvTNk1oxMG9EmBkH6','John','Doe','testuser_1747650846601@example.com','user','2025-05-19T10:34:06.688Z','2025-05-19T10:34:06.688Z');
INSERT INTO users VALUES(95,'testuser_1747656074901','$2b$10$mkwmtPGww4nLMZhfdk5D5OTH23j/TnfcrGAUmv./sipjRUV4E1c.2','John','Doe','testuser_1747656074901@example.com','user','2025-05-19T12:01:14.985Z','2025-05-19T12:01:14.985Z');
INSERT INTO users VALUES(96,'testuser_1747656416886','$2b$10$rbOoy5piwdaX4HGXrCaxluJqFnauGLjX9EN0HeMdlXVKVNtVgMlci','John','Doe','testuser_1747656416886@example.com','user','2025-05-19T12:06:56.961Z','2025-05-19T12:06:56.961Z');
INSERT INTO users VALUES(97,'testuser_1747656710462','$2b$10$j0Wnv/m46DCejEIubYCtY.argq6dnJcuQSchLiNDvpT1vDQMkn8wW','John','Doe','testuser_1747656710462@example.com','user','2025-05-19T12:11:50.535Z','2025-05-19T12:11:50.535Z');
INSERT INTO users VALUES(98,'testuser_1747656844206','$2b$10$aw/pZfma0v8iFRsW57qtOu4UhsDGzvyBW46ClzDM6yn7etinT.nqW','John','Doe','testuser_1747656844206@example.com','user','2025-05-19T12:14:04.280Z','2025-05-19T12:14:04.280Z');
INSERT INTO users VALUES(99,'testuser_1747656876875','$2b$10$.2XVGPUYVGJRXPh.kx9i0ue6RNB1JiIRx.V596jJkdDlVcD6Bb1LS','John','Doe','testuser_1747656876875@example.com','user','2025-05-19T12:14:36.948Z','2025-05-19T12:14:36.948Z');
INSERT INTO users VALUES(100,'testuser_1747657179325','$2b$10$X6R5f.oVqgbBzT6MJXlTUOWv.rCLyPkx0z/XixzhBe3sCr4YezBwG','John','Doe','testuser_1747657179325@example.com','user','2025-05-19T12:19:39.400Z','2025-05-19T12:19:39.400Z');
INSERT INTO users VALUES(101,'testuser_1747657284940','$2b$10$u115zkOFVuEjrYRFky5Cnu592AaDUSGdQwveVMb6BruUONqtDTm42','John','Doe','testuser_1747657284940@example.com','user','2025-05-19T12:21:25.013Z','2025-05-19T12:21:25.013Z');
INSERT INTO users VALUES(102,'testuser_1747657453560','$2b$10$BJembPUIupGXK/T5VpH8auXWWed3tU6UqNYZAwkPMIjo20eN71G2S','John','Doe','testuser_1747657453560@example.com','user','2025-05-19T12:24:13.634Z','2025-05-19T12:24:13.634Z');
INSERT INTO users VALUES(103,'testuser_1747657480830','$2b$10$vdvFqsWsz.hfcMsK3jVJ/u/xEe1jXBLLhHWkvoyP4EAaSZ/Bbvgxq','John','Doe','testuser_1747657480830@example.com','user','2025-05-19T12:24:40.904Z','2025-05-19T12:24:40.904Z');
INSERT INTO users VALUES(104,'testuser_1747657951932','$2b$10$E8genEF.N.96v4IuGBEnJea70jhmv7u.2b3s3rGwBff/5yGbgoXEy','John','Doe','testuser_1747657951932@example.com','user','2025-05-19T12:32:32.009Z','2025-05-19T12:32:32.009Z');
INSERT INTO users VALUES(105,'testuser_1747658302227','$2b$10$/j1K5IJUOqWjxqYlPym.gOzgjHcuDL8UdkZZQaAlq4VSawTXoJ7VG','John','Doe','testuser_1747658302227@example.com','user','2025-05-19T12:38:22.300Z','2025-05-19T12:38:22.300Z');
INSERT INTO users VALUES(106,'testuser_1747658310526','$2b$10$ZyNs/mkoyIP4TWn//4Uw4uINvg4i571phjh/8x5ockAcFGIZ.RoDK','John','Doe','testuser_1747658310526@example.com','user','2025-05-19T12:38:22.567Z','2025-05-19T12:38:22.567Z');
INSERT INTO users VALUES(108,'testuser_1747658406490','$2b$10$2ZUWfo0vjbSnthRYi6phl.N2k7fzJ1oE05gxOJ2OJGU4n.RRcXwfW','John','Doe','testuser_1747658406490@example.com','user','2025-05-19T12:40:06.564Z','2025-05-19T12:40:06.564Z');
INSERT INTO users VALUES(109,'testuser_1747658407240','$2b$10$mOI6hWt.Z2L5UI/Tm5ctT.jJ9iH9C66xhBz387uB1GmczWjN8GJoa','John','Doe','testuser_1747658407240@example.com','user','2025-05-19T12:40:06.834Z','2025-05-19T12:40:06.834Z');
INSERT INTO users VALUES(111,'testuser_1747658598992','$2b$10$joFa1bYAZhhG2c1arSWFJeBoHxjU933B4KhKjBqScC/HMDYBXhieS','John','Doe','testuser_1747658598992@example.com','user','2025-05-19T12:43:19.065Z','2025-05-19T12:43:19.065Z');
INSERT INTO users VALUES(112,'testuser_1747658605151','$2b$10$aTFhy23AIIsa4hzDbRV0qepesGxbIp.hQ6YzyFvm0AJYSw8kDWV8i','John','Doe','testuser_1747658605151@example.com','user','2025-05-19T12:43:19.334Z','2025-05-19T12:43:19.334Z');
INSERT INTO users VALUES(114,'testuser_1747658648689','$2b$10$e.bokvj9zkwJGO5zWIDV8ePodj0zK2TwW3q/aL3DK6.CpKaiFYoGm','John','Doe','testuser_1747658648689@example.com','user','2025-05-19T12:44:08.763Z','2025-05-19T12:44:08.763Z');
INSERT INTO users VALUES(115,'testuser_1747658656289','$2b$10$a/u8jdtqLOv1F/tSQu.aQeiBsB6IcjEeoKItoErjEedLEInwGznkO','John','Doe','testuser_1747658656289@example.com','user','2025-05-19T12:44:09.033Z','2025-05-19T12:44:09.033Z');
INSERT INTO users VALUES(117,'testuser_1747659128484','$2b$10$xC2o0ojBAeAHfGQU9ZpNpOOGM5jX3Q6CG0B.BcjusZo.qHc6uleCy','John','Doe','testuser_1747659128484@example.com','user','2025-05-19T12:52:08.559Z','2025-05-19T12:52:08.559Z');
INSERT INTO users VALUES(118,'testuser_1747659134293','$2b$10$aNU1MemKyROr5qyqjkohnORTLPl2lHE/mox0NcIXZtLDK6HqUwf0.','John','Doe','testuser_1747659134293@example.com','user','2025-05-19T12:52:08.825Z','2025-05-19T12:52:08.825Z');
INSERT INTO users VALUES(120,'testuser_1747660680140','$2b$10$EObv/K7exdQukLHZlqMGGOWkabdROQ/gWXeDgx7ABlVP4xY.gjmMq','John','Doe','testuser_1747660680140@example.com','user','2025-05-19T13:18:00.218Z','2025-05-19T13:18:00.218Z');
INSERT INTO users VALUES(121,'testuser_1747660687566','$2b$10$jaP5GjQv.whB5WZKcgI9eOSR9bQjdapsQITeGcgxc0OJ1yZUrB1FG','John','Doe','testuser_1747660687566@example.com','user','2025-05-19T13:18:00.486Z','2025-05-19T13:18:00.486Z');
INSERT INTO users VALUES(123,'testuser_1747661713155','$2b$10$1GjsQ4ZcWHoL2EjoBOT6Kut2.Ntjda4wHq2kBlAKxqrwVI05sB9LW','John','Doe','testuser_1747661713155@example.com','user','2025-05-19T13:35:13.246Z','2025-05-19T13:35:13.246Z');
INSERT INTO users VALUES(124,'testuser_1747661716036','$2b$10$18L/oHsO3CmSAOVAn3RzquDjaoihcj4Jm3jsrso3Sa9SSCMUYtnqO','John','Doe','testuser_1747661716036@example.com','user','2025-05-19T13:35:13.531Z','2025-05-19T13:35:13.531Z');
CREATE TABLE accounts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                account_number TEXT UNIQUE NOT NULL,
                balance REAL DEFAULT 0,
                currency TEXT DEFAULT 'EUR',
                is_active BOOLEAN DEFAULT 1,
                type TEXT DEFAULT 'checking',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                -- Temporarily removed foreign key constraint for testing
                -- FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
INSERT INTO accounts VALUES(1,1,'31331542979',1000.0,'EUR',1,'checking','2025-04-11 10:29:07','2025-04-11 13:41:28');
INSERT INTO accounts VALUES(2,2,'31327415209',1000.0,'EUR',1,'checking','2025-04-18 16:21:05','2025-04-18 16:21:05');
INSERT INTO accounts VALUES(3,2,'31369659501',1000.0,'USD',1,'savings','2025-04-18 16:23:46','2025-04-18 16:23:46');
INSERT INTO accounts VALUES(4,3,'31353317818',1000.0,'EUR',1,'checking','2025-04-18 16:53:32','2025-04-18 16:53:32');
INSERT INTO accounts VALUES(5,7,'31374402785',1000.0,'EUR',1,'checking','2025-05-16 07:06:09','2025-05-16 07:06:09');
INSERT INTO accounts VALUES(6,20,'31377388038',1000.0,'EUR',1,'checking','2025-05-16 08:55:15','2025-05-16 08:55:15');
INSERT INTO accounts VALUES(7,20,'31337577467',1000.0,'EUR',1,'checking','2025-05-16 08:55:17','2025-05-16 08:55:17');
INSERT INTO accounts VALUES(8,21,'31352490710',1000.0,'EUR',1,'checking','2025-05-16 09:00:25','2025-05-16 09:00:25');
INSERT INTO accounts VALUES(9,21,'31343513291',1000.0,'EUR',1,'checking','2025-05-16 09:00:28','2025-05-16 09:00:28');
INSERT INTO accounts VALUES(10,22,'31324175978',1000.0,'EUR',1,'checking','2025-05-16 09:03:44','2025-05-16 09:03:44');
INSERT INTO accounts VALUES(11,22,'31314404749',1000.0,'EUR',1,'checking','2025-05-16 09:03:46','2025-05-16 09:03:46');
INSERT INTO accounts VALUES(12,23,'31371246982',1000.0,'EUR',1,'checking','2025-05-16 09:07:20','2025-05-16 09:07:20');
INSERT INTO accounts VALUES(13,23,'31388644797',1000.0,'EUR',1,'checking','2025-05-16 09:07:22','2025-05-16 09:07:22');
INSERT INTO accounts VALUES(14,24,'31355773044',1000.0,'EUR',1,'checking','2025-05-16 09:07:35','2025-05-16 09:07:35');
INSERT INTO accounts VALUES(15,24,'31360820938',1000.0,'EUR',1,'checking','2025-05-16 09:07:38','2025-05-16 09:07:38');
INSERT INTO accounts VALUES(16,25,'31345676005',1000.0,'EUR',1,'checking','2025-05-16 09:10:23','2025-05-16 09:10:23');
INSERT INTO accounts VALUES(17,25,'31386335996',1000.0,'EUR',1,'checking','2025-05-16 09:10:25','2025-05-16 09:10:25');
INSERT INTO accounts VALUES(18,26,'31399178533',1000.0,'EUR',1,'checking','2025-05-16 09:11:34','2025-05-16 09:11:34');
INSERT INTO accounts VALUES(19,26,'31397967549',1000.0,'EUR',1,'checking','2025-05-16 09:11:36','2025-05-16 09:11:36');
INSERT INTO accounts VALUES(20,27,'31319672340',1000.0,'EUR',1,'checking','2025-05-16 09:15:47','2025-05-16 09:15:47');
INSERT INTO accounts VALUES(21,27,'31359388256',1000.0,'EUR',1,'checking','2025-05-16 09:15:49','2025-05-16 09:15:49');
INSERT INTO accounts VALUES(22,28,'31333027588',1000.0,'EUR',1,'checking','2025-05-16 09:18:34','2025-05-16 09:18:34');
INSERT INTO accounts VALUES(23,28,'31393937309',1000.0,'EUR',1,'checking','2025-05-16 09:18:37','2025-05-16 09:18:37');
INSERT INTO accounts VALUES(24,29,'31355623789',1000.0,'EUR',1,'checking','2025-05-16 09:19:45','2025-05-16 09:19:45');
INSERT INTO accounts VALUES(25,29,'31378402310',1000.0,'EUR',1,'checking','2025-05-16 09:19:48','2025-05-16 09:19:48');
INSERT INTO accounts VALUES(26,30,'31355229230',1000.0,'EUR',1,'checking','2025-05-16 09:31:59','2025-05-16 09:31:59');
INSERT INTO accounts VALUES(27,30,'31360281817',1000.0,'EUR',1,'checking','2025-05-16 09:31:59','2025-05-16 09:31:59');
INSERT INTO accounts VALUES(28,31,'31383042760',1000.0,'EUR',1,'checking','2025-05-16 09:34:30','2025-05-16 09:34:30');
INSERT INTO accounts VALUES(29,31,'31363445188',1000.0,'EUR',1,'checking','2025-05-16 09:34:30','2025-05-16 09:34:30');
INSERT INTO accounts VALUES(30,32,'31391915612',1000.0,'EUR',1,'checking','2025-05-16 09:36:38','2025-05-16 09:36:38');
INSERT INTO accounts VALUES(31,32,'31389612610',1000.0,'EUR',1,'checking','2025-05-16 09:36:38','2025-05-16 09:36:38');
INSERT INTO accounts VALUES(32,33,'31331448491',1000.0,'EUR',1,'checking','2025-05-16 09:48:03','2025-05-16 09:48:03');
INSERT INTO accounts VALUES(34,34,'31323138590',1000.0,'EUR',1,'checking','2025-05-16 10:03:47','2025-05-16 10:03:47');
INSERT INTO accounts VALUES(36,35,'31381378184',1000.0,'EUR',1,'checking','2025-05-16 10:57:17','2025-05-16 10:57:17');
INSERT INTO accounts VALUES(38,36,'31387229815',1000.0,'EUR',1,'checking','2025-05-16 10:57:58','2025-05-16 10:57:58');
INSERT INTO accounts VALUES(40,37,'31373577448',1000.0,'EUR',1,'checking','2025-05-16 11:13:12','2025-05-16 11:13:12');
INSERT INTO accounts VALUES(42,38,'31354895726',900.0,'EUR',1,'checking','2025-05-16 11:20:06','2025-05-16 11:22:02');
INSERT INTO accounts VALUES(43,38,'31374536497',1100.0,'EUR',1,'savings','2025-05-16 11:21:25','2025-05-16 11:22:02');
INSERT INTO accounts VALUES(44,39,'31382677783',1000.0,'EUR',1,'checking','2025-05-16 15:15:47','2025-05-16 15:15:47');
INSERT INTO accounts VALUES(45,39,'31363714018',1000.0,'EUR',1,'checking','2025-05-16 15:15:47','2025-05-16 15:15:47');
INSERT INTO accounts VALUES(46,40,'31311405073',1000.0,'EUR',1,'checking','2025-05-16 15:17:21','2025-05-16 15:17:21');
INSERT INTO accounts VALUES(47,40,'31346579781',1000.0,'EUR',1,'checking','2025-05-16 15:17:21','2025-05-16 15:17:21');
INSERT INTO accounts VALUES(48,41,'31372321970',1000.0,'EUR',1,'checking','2025-05-16 15:25:18','2025-05-16 15:25:18');
INSERT INTO accounts VALUES(49,41,'31348589051',1000.0,'EUR',1,'checking','2025-05-16 15:25:18','2025-05-16 15:25:18');
INSERT INTO accounts VALUES(50,42,'31318257414',1000.0,'EUR',1,'checking','2025-05-16 15:27:00','2025-05-16 15:27:00');
INSERT INTO accounts VALUES(51,42,'31338018671',1000.0,'EUR',1,'checking','2025-05-16 15:27:00','2025-05-16 15:27:00');
INSERT INTO accounts VALUES(52,43,'31337358419',1000.0,'EUR',1,'checking','2025-05-16 15:28:51','2025-05-16 15:28:51');
INSERT INTO accounts VALUES(53,43,'31388610163',1000.0,'EUR',1,'checking','2025-05-16 15:28:51','2025-05-16 15:28:51');
INSERT INTO accounts VALUES(54,44,'31361799732',1000.0,'EUR',1,'checking','2025-05-17 07:07:38','2025-05-17 07:07:38');
INSERT INTO accounts VALUES(55,44,'31358443267',1000.0,'EUR',1,'checking','2025-05-17 07:07:38','2025-05-17 07:07:38');
INSERT INTO accounts VALUES(56,45,'31323753405',1000.0,'EUR',1,'checking','2025-05-17 07:13:09','2025-05-17 07:13:09');
INSERT INTO accounts VALUES(57,45,'31374533247',1000.0,'EUR',1,'checking','2025-05-17 07:13:09','2025-05-17 07:13:09');
INSERT INTO accounts VALUES(58,46,'31396277158',1000.0,'EUR',1,'checking','2025-05-17 07:17:31','2025-05-17 07:17:31');
INSERT INTO accounts VALUES(59,46,'31370791693',1000.0,'EUR',1,'checking','2025-05-17 07:17:31','2025-05-17 07:17:31');
INSERT INTO accounts VALUES(60,47,'31372731699',1000.0,'EUR',1,'checking','2025-05-17 07:22:38','2025-05-17 07:22:38');
INSERT INTO accounts VALUES(61,47,'31385268597',1000.0,'EUR',1,'checking','2025-05-17 07:22:38','2025-05-17 07:22:38');
INSERT INTO accounts VALUES(62,48,'31354691944',1000.0,'EUR',1,'checking','2025-05-17 07:23:07','2025-05-17 07:23:07');
INSERT INTO accounts VALUES(63,48,'31385960732',1000.0,'EUR',1,'checking','2025-05-17 07:23:07','2025-05-17 07:23:07');
INSERT INTO accounts VALUES(64,64,'31347101457',1000.0,'EUR',1,'checking','2025-05-18T16:17:26.059Z','2025-05-18T16:17:26.059Z');
INSERT INTO accounts VALUES(65,64,'31347519968',1000.0,'EUR',1,'checking','2025-05-18T16:17:26.069Z','2025-05-18T16:17:26.069Z');
INSERT INTO accounts VALUES(66,68,'OAP81772624',1000.0,'EUR',1,'checking','2025-05-18T16:54:39.549Z','2025-05-18T16:54:39.549Z');
INSERT INTO accounts VALUES(67,68,'OAP24392063',1000.0,'EUR',1,'checking','2025-05-18T16:54:39.558Z','2025-05-18T16:54:39.558Z');
INSERT INTO accounts VALUES(68,72,'OAP50325391',1000.0,'EUR',1,'checking','2025-05-18T17:31:01.295Z','2025-05-18T17:31:01.295Z');
INSERT INTO accounts VALUES(69,72,'OAP76898594',1000.0,'EUR',1,'checking','2025-05-18T17:31:01.304Z','2025-05-18T17:31:01.304Z');
INSERT INTO accounts VALUES(70,74,'OAP94546051',1000.0,'EUR',1,'checking','2025-05-18T17:36:34.306Z','2025-05-18T17:36:34.306Z');
INSERT INTO accounts VALUES(71,74,'OAP44564975',1000.0,'EUR',1,'checking','2025-05-18T17:36:34.316Z','2025-05-18T17:36:34.316Z');
INSERT INTO accounts VALUES(72,75,'OAP33027504',1000.0,'EUR',1,'checking','2025-05-18T17:37:24.735Z','2025-05-18T17:37:24.735Z');
INSERT INTO accounts VALUES(73,75,'OAP26440839',1000.0,'EUR',1,'checking','2025-05-18T17:37:24.743Z','2025-05-18T17:37:24.743Z');
INSERT INTO accounts VALUES(74,76,'OAP36656350',1000.0,'EUR',1,'checking','2025-05-19T07:19:16.582Z','2025-05-19T07:19:16.582Z');
INSERT INTO accounts VALUES(75,76,'OAP44061479',1000.0,'EUR',1,'checking','2025-05-19T07:19:16.591Z','2025-05-19T07:19:16.591Z');
INSERT INTO accounts VALUES(76,78,'OAP75471309',1000.0,'EUR',1,'checking','2025-05-19T07:23:05.655Z','2025-05-19T07:23:05.655Z');
INSERT INTO accounts VALUES(77,78,'OAP61129232',1000.0,'EUR',1,'checking','2025-05-19T07:23:05.664Z','2025-05-19T07:23:05.664Z');
INSERT INTO accounts VALUES(78,79,'OAP27872895',1000.0,'EUR',1,'checking','2025-05-19T07:27:38.657Z','2025-05-19T07:27:38.657Z');
INSERT INTO accounts VALUES(79,79,'OAP29221992',1000.0,'EUR',1,'checking','2025-05-19T07:27:38.665Z','2025-05-19T07:27:38.665Z');
INSERT INTO accounts VALUES(80,80,'OAP69786522',1000.0,'EUR',1,'checking','2025-05-19T07:29:34.078Z','2025-05-19T07:29:34.078Z');
INSERT INTO accounts VALUES(81,80,'OAP66134121',1000.0,'EUR',1,'checking','2025-05-19T07:29:34.088Z','2025-05-19T07:29:34.088Z');
INSERT INTO accounts VALUES(82,87,'OAP82739480',1000.0,'EUR',1,'checking','2025-05-19T10:29:31.024Z','2025-05-19T10:29:31.024Z');
INSERT INTO accounts VALUES(83,89,'OAP30797137',1000.0,'EUR',1,'checking','2025-05-19T10:30:26.028Z','2025-05-19T10:30:26.028Z');
INSERT INTO accounts VALUES(84,89,'OAP41720542',1000.0,'EUR',1,'checking','2025-05-19T10:30:26.100Z','2025-05-19T10:30:26.100Z');
INSERT INTO accounts VALUES(85,90,'OAP86509436',1000.0,'EUR',1,'checking','2025-05-19T10:31:09.008Z','2025-05-19T10:31:09.008Z');
INSERT INTO accounts VALUES(86,92,'OAP62537151',1000.0,'EUR',1,'checking','2025-05-19T10:32:57.055Z','2025-05-19T10:32:57.055Z');
INSERT INTO accounts VALUES(87,94,'OAP12504333',1000.0,'EUR',1,'checking','2025-05-19T10:34:07.035Z','2025-05-19T10:34:07.035Z');
INSERT INTO accounts VALUES(88,106,'OAP86840067',1000.0,'EUR',1,'checking','2025-05-19T12:38:22.632Z','2025-05-19T12:38:22.632Z');
INSERT INTO accounts VALUES(91,109,'OAP27311226',990.0,'EUR',1,'checking','2025-05-19T12:40:06.899Z','2025-05-19 12:40:07');
INSERT INTO accounts VALUES(94,112,'OAP50816902',990.0,'EUR',1,'checking','2025-05-19T12:43:19.399Z','2025-05-19 12:43:20');
INSERT INTO accounts VALUES(97,115,'OAP44014049',990.0,'EUR',1,'checking','2025-05-19T12:44:09.099Z','2025-05-19 12:44:10');
INSERT INTO accounts VALUES(100,118,'OAP44727963',990.0,'EUR',1,'checking','2025-05-19T12:52:08.890Z','2025-05-19 12:52:09');
INSERT INTO accounts VALUES(103,121,'OAP26575346',990.0,'EUR',1,'checking','2025-05-19T13:18:00.551Z','2025-05-19 13:18:01');
INSERT INTO accounts VALUES(106,124,'OAP51419289',965.0,'EUR',1,'checking','2025-05-19T13:35:13.598Z','2025-05-19 13:35:14');
CREATE TABLE transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                from_account TEXT,
                to_account TEXT NOT NULL,
                amount REAL NOT NULL,
                currency TEXT DEFAULT 'EUR',
                description TEXT,
                status TEXT DEFAULT 'pending',
                reference TEXT,
                transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP, created_at TEXT, updated_at TEXT,
                FOREIGN KEY (from_account) REFERENCES accounts(account_number)
                -- Removed foreign key constraint for to_account to allow external transactions
            );
INSERT INTO transactions VALUES(1,'31331542979','fe81744219832046',100.0,'EUR','undefined (Failed: Failed to send transaction to bank with prefix fe8: Request failed with status code 400)','failed','edf4b5c2-e7b1-4bbe-b387-e173bbf7e65d','2025-04-11 10:29:34',NULL,NULL);
INSERT INTO transactions VALUES(2,'31331542979','fe81744219832046',100.0,'EUR','undefined (Failed: Failed to send transaction to bank with prefix fe8: Request failed with status code 400)','failed','e3bea806-5aa3-43fd-bedb-7d10ed1ce7d9','2025-04-11 10:59:18',NULL,NULL);
INSERT INTO transactions VALUES(3,'31331542979','fe81744219832046',10.0,'EUR','undefined (Failed: Failed to send transaction to bank with prefix fe8: Request failed with status code 400)','failed','8bcfcd3b-b8df-43cc-b651-48e4efd13dd5','2025-04-11 11:46:42',NULL,NULL);
INSERT INTO transactions VALUES(4,'31331542979','fe81744219832046',100.0,'EUR','undefined (Failed: Failed to send transaction to bank with prefix fe8: Request failed with status code 400)','failed','d547ba90-0608-423b-97f1-c87336770529','2025-04-11 11:51:04',NULL,NULL);
INSERT INTO transactions VALUES(5,'31331542979','fe81744219832046',100.0,'EUR','undefined (Failed: Cannot read properties of undefined (reading ''substring''))','failed','97957ed1-0dbb-4ef2-90ae-80f3da3cb47d','2025-04-11 12:10:23',NULL,NULL);
INSERT INTO transactions VALUES(6,'31331542979','fe81744219832046',100.0,'EUR','undefined (Failed: Failed to send transaction to bank with prefix fe8: Request failed with status code 500)','failed','66821500-3a0e-4c68-b01a-c617bf7da3d6','2025-04-11 12:41:47',NULL,NULL);
INSERT INTO transactions VALUES(7,'31331542979','fe81744219832046',10.0,'EUR','undefined (Failed: Failed to send transaction to bank with prefix fe8: Request failed with status code 500)','failed','5c617897-6868-4aa0-b770-47cbc0dcb2e7','2025-04-11 12:42:56',NULL,NULL);
INSERT INTO transactions VALUES(8,'31331542979','fe81744219832046',10.0,'EUR','undefined (Failed: Failed to send transaction to bank with prefix fe8: Request failed with status code 500)','failed','ae0f6402-b824-483e-810b-9bbc23db6a39','2025-04-11 13:41:28',NULL,NULL);
INSERT INTO transactions VALUES(9,'31387229815','31300000000',5.0,'EUR','External transaction to test account','pending','27194e46-853a-4a76-9add-c1feab61dda7','2025-05-16 10:57:58',NULL,NULL);
INSERT INTO transactions VALUES(10,'31373577448','31300000000',5.0,'EUR','External transaction to test account','pending','50a6624e-b3e7-4cd8-b62e-4623187f8eff','2025-05-16 11:13:12',NULL,NULL);
INSERT INTO transactions VALUES(11,'31354895726','31300000000',100.0,'EUR','External transaction to test account','pending','70130125-262d-4b47-80dc-a5c2164e64c7','2025-05-16 11:20:36',NULL,NULL);
INSERT INTO transactions VALUES(12,'31354895726','31374536497',100.0,'EUR',' (Converted: 100 EUR → 100 EUR)','completed','d7560aa7-2a6b-4664-ad28-ed783118da1b','2025-05-16 11:22:02',NULL,NULL);
INSERT INTO transactions VALUES(13,'31354895726','31300000000',10.0,'EUR','External transaction to test account','pending','1c823697-afbf-4efa-a90d-8679b3119ad2','2025-05-16 11:25:22',NULL,NULL);
INSERT INTO transactions VALUES(14,'OAP27311226','61c8ef8e5c2a7c90fb67b5a502a34291ae5',25.0,'EUR',NULL,'failed','cdf8a77d-21a7-49d9-8316-fd106c769d87','2025-05-19 12:40:07',NULL,NULL);
INSERT INTO transactions VALUES(15,'OAP50816902','61c8ef8e5c2a7c90fb67b5a502a34291ae5',25.0,'EUR',NULL,'failed','876abc4a-f38f-41ba-b909-6a423d415ba8','2025-05-19 12:43:19',NULL,NULL);
INSERT INTO transactions VALUES(16,'OAP44014049','OAP72301372',10.0,'EUR',' (Converted: 10 EUR → 10 EUR)','completed','96d0debc-59d9-452c-b10b-c6c982edc3c8','2025-05-19 12:44:09','2025-05-19T12:44:09.237Z','2025-05-19T12:44:09.237Z');
INSERT INTO transactions VALUES(17,'OAP44014049','61c8ef8e5c2a7c90fb67b5a502a34291ae5',25.0,'EUR',NULL,'failed','11818c8e-f741-4077-98da-c2a7fc939bce','2025-05-19 12:44:09',NULL,NULL);
INSERT INTO transactions VALUES(18,'OAP44727963','OAP80948864',10.0,'EUR',' (Converted: 10 EUR → 10 EUR)','completed','0c605b76-4ae3-4968-82da-558fa768422f','2025-05-19 12:52:09','2025-05-19T12:52:09.024Z','2025-05-19T12:52:09.024Z');
INSERT INTO transactions VALUES(19,'OAP44727963','61c8ef8e5c2a7c90fb67b5a502a34291ae5',25.0,'EUR',NULL,'failed','7116b92a-57ea-4e4a-b4ba-09079dd9f3c7','2025-05-19 12:52:09',NULL,NULL);
INSERT INTO transactions VALUES(20,'OAP26575346','OAP62879578',10.0,'EUR',' (Converted: 10 EUR → 10 EUR)','completed','38c16aae-1ff9-4a90-846c-cd290a49cfbb','2025-05-19 13:18:00','2025-05-19T13:18:00.685Z','2025-05-19T13:18:00.685Z');
INSERT INTO transactions VALUES(21,'OAP26575346','61c8ef8e5c2a7c90fb67b5a502a34291ae5',25.0,'EUR',NULL,'failed','7fb6c4de-307b-4c01-8d15-fced8aef63f0','2025-05-19 13:18:01',NULL,NULL);
INSERT INTO transactions VALUES(22,'OAP51419289','OAP71546149',10.0,'EUR',' (Converted: 10 EUR → 10 EUR)','completed','0e76bbca-c252-405f-80d5-4f326b62539d','2025-05-19 13:35:13','2025-05-19T13:35:13.740Z','2025-05-19T13:35:13.740Z');
CREATE TABLE external_banks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                prefix TEXT UNIQUE NOT NULL,
                transactionUrl TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
INSERT INTO external_banks VALUES(4778,'barBank','61c','https://henno.cfd/henno-pank/transactions/b2b','2025-05-19 13:44:02');
INSERT INTO external_banks VALUES(4779,'DigiPank','d38','https://pank.digikaup.online/transactions/b2b','2025-05-19 13:44:02');
INSERT INTO external_banks VALUES(4780,'DIPANK','c44','https://pank.digikaup.online/transactions/b2b','2025-05-19 13:44:02');
INSERT INTO external_banks VALUES(4781,'Eero Bank','be5','https://bank.eerovallistu.site/transactions/b2b','2025-05-19 13:44:02');
INSERT INTO external_banks VALUES(4782,'EfeBank','84f','https://bank.bee-srv.me/transactions/b2b','2025-05-19 13:44:02');
INSERT INTO external_banks VALUES(4783,'Nele Bank','300','https://nele.my/nele-bank/api/v1/transactions/b2b','2025-05-19 13:44:02');
INSERT INTO external_banks VALUES(4784,'NLine Pank','30b','https://pank.digikaup.online/api/transactions/b2b','2025-05-19 13:44:02');
INSERT INTO external_banks VALUES(4785,'NLine Pank V2','c9b','https://pank.digikaup.online/api/transactions/b2b','2025-05-19 13:44:02');
INSERT INTO external_banks VALUES(4786,'OA-Pank','940','https://hack2you.eu/oa-pank/transactions/b2b','2025-05-19 13:44:02');
INSERT INTO external_banks VALUES(4787,'Ove Bank API','fb4','https://henno.cfd/ove-bank/api/transactions/external','2025-05-19 13:44:02');
CREATE TABLE invalidated_tokens (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                token TEXT UNIQUE NOT NULL,
                invalidated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                expires_at DATETIME NOT NULL
            );
DELETE FROM sqlite_sequence;
INSERT INTO sqlite_sequence VALUES('external_banks',4787);
INSERT INTO sqlite_sequence VALUES('users',125);
INSERT INTO sqlite_sequence VALUES('accounts',108);
INSERT INTO sqlite_sequence VALUES('transactions',22);
COMMIT;
