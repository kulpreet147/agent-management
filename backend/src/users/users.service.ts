import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';

const SEED_USERS = [
  {
    name: 'Admin User',
    email: 'admin123@gmail.com',
    password: '12345678',
    role: UserRole.Admin,
  },
  {
    name: 'Master Admin',
    email: 'madmin@gmail.com',
    password: '87654321',
    role: UserRole.MasterAdmin,
  },
];

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    await this.seedDefaultUsers();
  }

  findByEmail(email: string) {
    return this.usersRepository.findOne({
      where: { email: email.toLowerCase(), isActive: true },
    });
  }

  private async seedDefaultUsers() {
    for (const seedUser of SEED_USERS) {
      const existingUser = await this.usersRepository.findOne({
        where: { email: seedUser.email },
      });

      const passwordHash = await bcrypt.hash(seedUser.password, 10);

      if (existingUser) {
        await this.usersRepository.update(existingUser.id, {
          name: seedUser.name,
          passwordHash,
          role: seedUser.role,
          isActive: true,
        });
        continue;
      }

      await this.usersRepository.save(
        this.usersRepository.create({
          name: seedUser.name,
          email: seedUser.email,
          passwordHash,
          role: seedUser.role,
          isActive: true,
        }),
      );
    }
  }
}
