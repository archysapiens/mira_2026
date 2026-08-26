SET NOCOUNT ON;
INSERT mira.Roles(Code,Name) VALUES('CLIENT','Cliente'),('OPERATOR','Operador'),('ADMIN','Administrador / supervisor root');
INSERT mira.Services(Code,Name,Description) VALUES
('SILOS','Limpieza y mantenimiento de silos','Limpieza, sanitización y mantenimiento especializado.'),
('EPOXY','Recubrimientos epóxicos','Sistemas de protección para industria alimentaria.'),
('SANITY','Fumigación y sanitización','Control sanitario para instalaciones.'),
('ROOFS','Mantenimiento de techos','Limpieza y mantenimiento de estructuras y cubiertas.');

DECLARE @Hash123 VARCHAR(64)=CONVERT(VARCHAR(64),HASHBYTES('SHA2_256','123'),2);
INSERT mira.Users(Email,PasswordHash,FullName,Company,RoleId)
SELECT 'cliente@mira.com',@Hash123,'Cliente MIRA','Cliente demostración',RoleId FROM mira.Roles WHERE Code='CLIENT';
INSERT mira.Users(Email,PasswordHash,FullName,Company,RoleId)
SELECT 'operador@mira.com',@Hash123,'Carlos Mendoza','MIRA',RoleId FROM mira.Roles WHERE Code='OPERATOR';
INSERT mira.Users(Email,PasswordHash,FullName,Company,RoleId)
SELECT 'admin@mira.com',@Hash123,'Administrador MIRA','MIRA',RoleId FROM mira.Roles WHERE Code='ADMIN';
GO

DECLARE @Client UNIQUEIDENTIFIER=(SELECT UserId FROM mira.Users WHERE Email='cliente@mira.com');
DECLARE @Operator UNIQUEIDENTIFIER=(SELECT UserId FROM mira.Users WHERE Email='operador@mira.com');
DECLARE @Admin UNIQUEIDENTIFIER=(SELECT UserId FROM mira.Users WHERE Email='admin@mira.com');
DECLARE @R1 UNIQUEIDENTIFIER=NEWID(), @R2 UNIQUEIDENTIFIER=NEWID();
INSERT mira.Requests(RequestId,ClientUserId,ContactName,Email,Phone,Company,Location,Need,Urgency,Description,Status,AssignedOperatorId,AssignedByUserId,AssignedAt)
VALUES(@R1,@Client,'Cliente MIRA','cliente@mira.com','7220000000','Cliente demostración','Toluca, Estado de México','Mantenimiento industrial','Próximos 30 días','Revisión de recubrimiento epóxico.','A',@Operator,@Admin,SYSUTCDATETIME()),
(@R2,@Client,'Cliente MIRA','cliente@mira.com','7220000000','Cliente demostración','Ixtlahuaca, Estado de México','Limpieza industrial','Lo antes posible','Limpieza y sanitización de silo.','E',NULL,NULL,NULL);
INSERT mira.RequestServices SELECT @R1,ServiceId FROM mira.Services WHERE Code='EPOXY';
INSERT mira.RequestServices SELECT @R2,ServiceId FROM mira.Services WHERE Code='SILOS';
INSERT mira.StatusHistory(RequestId,PreviousStatus,NewStatus,Comment,ChangedByUserId) VALUES(@R1,'E','A','Asignada a operador',@Admin),(@R2,NULL,'E','Solicitud creada desde web',@Client);
INSERT mira.WorkNotes(RequestId,UserId,Note) VALUES(@R1,@Operator,'Visita técnica confirmada para el jueves.');
GO

