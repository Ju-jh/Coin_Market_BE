import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { GoogleUser } from './entity/google.entity';
import { GoogleRepository } from './google.repository';

@Injectable()
export class GoogleService {
  constructor(
    @InjectRepository(GoogleRepository)
    private readonly googleRepository: GoogleRepository,
    private readonly jwtService: JwtService,
  ) {}

  async findByEmailOrSave(
    email: string,
    username: string,
    photo: string,
  ): Promise<GoogleUser> {
    try {
      let user = await this.getUser(email);
      if (!user) {
        user = await this.googleRepository.save({
          email,
          username,
          photo,
        });
      }
      return user;
    } catch (err) {
      // 적절한 에러 처리 추가
      throw new NotFoundException('User not found');
    }
  }

  async googleLoginAPI(credential: string): Promise<string> {
    const decodeCredential = this.jwtService.decode(credential) as Record<
      string,
      string
    >;
    const { email, name, picture } = decodeCredential;
    const user = await this.findByEmailOrSave(email, name, picture);
    const payload = { user };
    const access_token = this.jwtService.sign(payload);
    return access_token;
  }

  async getUser(email: string): Promise<GoogleUser | null> {
    return this.googleRepository.findOne({
      where: { email },
    });
  }
}