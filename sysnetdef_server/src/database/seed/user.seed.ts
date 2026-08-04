import bcrypt from "bcrypt";

// Chúng ta băm sẵn password123 để nạp vào DB
const hashedDefaultPassword = bcrypt.hashSync("12345678", 10);

export const userSeeds = [
  {
    fullName: 'System Administrator',
    username: 'admin',
    password: hashedDefaultPassword,
    email: 'admin@sysnetdef.local',
    role: 'admin',
    notify: 'enabled'
  }
];