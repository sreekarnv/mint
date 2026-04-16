import { SseService } from './sse.service';

describe('SseService', () => {
  let service: SseService;

  beforeEach(() => {
    service = new SseService();
  });

  function makeObserver() {
    return { next: jest.fn(), error: jest.fn(), complete: jest.fn() };
  }

  describe('register / deregister', () => {
    it('registers a client and broadcasts to it', () => {
      const obs = makeObserver();
      service.register('u-1', obs as any);
      service.broadcast('u-1', { id: 'n-1' });
      expect(obs.next).toHaveBeenCalledWith({
        data: JSON.stringify({ id: 'n-1' }),
      });
    });

    it('deregisters a client so it no longer receives broadcasts', () => {
      const obs = makeObserver();
      service.register('u-1', obs as any);
      service.deregister('u-1', obs as any);
      service.broadcast('u-1', { id: 'n-2' });
      expect(obs.next).not.toHaveBeenCalled();
    });

    it('removes the user entry when the last client disconnects', () => {
      const obs = makeObserver();
      service.register('u-1', obs as any);
      service.deregister('u-1', obs as any);
      // broadcast should be a no-op (no entry in map)
      expect(() => service.broadcast('u-1', {})).not.toThrow();
    });

    it('supports multiple clients for the same user', () => {
      const obs1 = makeObserver();
      const obs2 = makeObserver();
      service.register('u-1', obs1 as any);
      service.register('u-1', obs2 as any);
      service.broadcast('u-1', { id: 'n-3' });
      expect(obs1.next).toHaveBeenCalledTimes(1);
      expect(obs2.next).toHaveBeenCalledTimes(1);
    });

    it('only deregisters the target client, not others', () => {
      const obs1 = makeObserver();
      const obs2 = makeObserver();
      service.register('u-1', obs1 as any);
      service.register('u-1', obs2 as any);
      service.deregister('u-1', obs1 as any);
      service.broadcast('u-1', { id: 'n-4' });
      expect(obs1.next).not.toHaveBeenCalled();
      expect(obs2.next).toHaveBeenCalledTimes(1);
    });
  });

  describe('broadcast', () => {
    it('does nothing when no clients are registered for the user', () => {
      expect(() => service.broadcast('nobody', { id: 'n-5' })).not.toThrow();
    });

    it('continues broadcasting to other clients if one throws', () => {
      const obs1 = makeObserver();
      const obs2 = makeObserver();
      obs1.next.mockImplementation(() => {
        throw new Error('dead client');
      });
      service.register('u-1', obs1 as any);
      service.register('u-1', obs2 as any);
      expect(() => service.broadcast('u-1', { id: 'n-6' })).not.toThrow();
      expect(obs2.next).toHaveBeenCalledTimes(1);
    });

    it('serializes notification to JSON string in the event data', () => {
      const obs = makeObserver();
      service.register('u-1', obs as any);
      const notification = { id: 'n-7', title: 'Hello' };
      service.broadcast('u-1', notification);
      expect(obs.next).toHaveBeenCalledWith({
        data: JSON.stringify(notification),
      });
    });
  });
});
