import * as signalR from '@microsoft/signalr';

class SignalRService {
  constructor() {
    this.connection = null;
    this.isConnected = false;
  }

  connect(token) {
    if (this.connection && this.isConnected) {
      return Promise.resolve();
    }

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5050';
    const hubUrl = `${apiUrl.replace('/api', '')}/notificationhub`;

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .build();

    this.connection.onclose(() => {
      this.isConnected = false;
      console.log('SignalR connection closed');
    });

    this.connection.onreconnecting(() => {
      console.log('SignalR reconnecting...');
    });

    this.connection.onreconnected(() => {
      this.isConnected = true;
      console.log('SignalR reconnected');
    });

    return this.connection.start()
      .then(() => {
        this.isConnected = true;
        console.log('SignalR connected');
      })
      .catch((error) => {
        console.error('SignalR connection error:', error);
        this.isConnected = false;
      });
  }

  disconnect() {
    if (this.connection) {
      this.connection.stop();
      this.isConnected = false;
    }
  }

  on(eventName, callback) {
    if (this.connection) {
      this.connection.on(eventName, callback);
    }
  }

  off(eventName, callback) {
    if (this.connection) {
      this.connection.off(eventName, callback);
    }
  }

  send(methodName, ...args) {
    if (this.connection && this.isConnected) {
      return this.connection.invoke(methodName, ...args);
    }
    return Promise.reject('Not connected to SignalR');
  }
}

export const signalRService = new SignalRService();

