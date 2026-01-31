import { EventEmitter } from 'events';

class EventBus extends EventEmitter { }

// Singleton instance
const eventBus = new EventBus();

export default eventBus;
