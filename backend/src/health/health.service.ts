import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  getHealth() {
    return {
      name: 'AgentFlow Backend',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
