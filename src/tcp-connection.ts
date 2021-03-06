import NetworkNode from './network-node'
import NetworkPacket from './network-packet'
import Pipe from './pipe'

class TcpConnection {
    pipe: Pipe;
    send_buffer: string;
    receive_buffer: string;
    timeout: number; // 0: send first available packet, positive integers count-down to resending
    conn_status: Status;
    sent_data: number; // how much data has been sent

    constructor(start: NetworkNode, end: NetworkNode) {
        this.pipe = new Pipe(start, end);
        this.pipe.length = start.distanceTo(end)
        this.timeout = 0;
        this.conn_status = Status.Open;
        this.sent_data = 0;
        this.send_buffer = '';
        this.receive_buffer = '';

        start.transportLayer.add(this)
    }

    write(data: string) {
        this.send_buffer += data;
    }

    read(): string {
        return this.receive_buffer;
    }

    close() {
        this.conn_status = Status.Closing;
        this.sendPacket('F')
    }

    packetReceived(packet: NetworkPacket) {
        let payload = packet.payload;
        const packetType = payload.charAt(0);
        payload = payload.substring(1);
        if(packetType == 'A') {
            const ack_no = +payload;
            if(ack_no > this.sent_data) {
                this.sent_data = ack_no;
                if(this.sent_data != this.send_buffer.length) {
                    this.sendNext();
                } else {
                    // this.close();
                }
            }
        } else if(packetType == 'D') {
            const [ seq_no, data ] = payload.split('|')
            if(+seq_no == this.receive_buffer.length) {
                this.receive_buffer += data;
                console.log('Sent ack: ' + this.receive_buffer.length)
                this.sendPacket('A' + this.receive_buffer.length);

                this.converse();
            }
        } else if(packetType == 'F') {
            if(this.conn_status == Status.Closing || this.conn_status == Status.Closed) {
                this.conn_status = Status.Closed;
                console.log(this)
                console.log('Sent close 1')
                this.pipe.start.transportLayer.delete(this)
            } else if(this.conn_status == Status.Open) {
                this.conn_status = Status.Closed;
                this.pipe.start.transportLayer.delete(this)
                console.log(this)
                console.log('Sent close 2')
                console.log(packet)
                this.sendPacket('F')
            }
        }
    }

    tick() {
        this.timeout --;
        if(this.timeout <= 0 && this.sent_data != this.send_buffer.length) {
            if(this.pipe.networkPackets.length > 0 && !this.pipe.networkPackets[0].payload.startsWith("A")) {
                this.pipe.networkPackets.shift();
            }
            this.sendNext();
        }
        this.pipe.networkPackets = this.pipe.networkPackets.filter(packet => packet.distanceTraveled < this.pipe.length);
    }

    sendNext() {
        const chunk = this.send_buffer.substring(this.sent_data, this.sent_data + 8);
        this.sendPacket('D' + this.sent_data + '|' + chunk);
        this.timeout = 500;
    }

    sendPacket(payload: string) {
        const packet = new NetworkPacket(this.pipe.start.addr, this.pipe.end.addr, payload);
        this.pipe.start.enqueuePacket(packet);
        this.pipe.networkPackets.push(packet);
    }

    completed() {
        return this.conn_status == Status.Closed;
    }

    converse() {
        let markovChain: { [id: string]: any[] } = {
            "Hello.\n": [0.2, "Hello.\n", 0.4, "How are you?\n", 0.4, "What's up?\n"],
            "How are you?\n": [0.5, "Ok.\n", 0.1, "Not good.\n", 0.4, "Fine, how about you?\n"],
            "Ok.\n": [0.3, "Cool.\n", 0.7, "Yeah I know.\n"],
            "Fine, how about you?\n": [0.8, "Ok.\n", 0.2, "Not good.\n"],
            "Not good.\n": [0.2, "Yeah I know.\n", 0.8, "Oh no! What's up?\n"],
            "Cool.\n": [0.7, "Well, talk to you later?\n", 0.3, "Ok, talk to you later.\n"],
            "Yeah I know.\n": [0.2, "Well, talk to you later?\n", 0.8, "Ok, talk to you later.\n"],
            "What's up?\n": [0.2, "I don't know actually.\n", 0.5, "Nothing...\n", 0.3, "Don't wanna talk.\n"],
            "I don't know actually.\n": [0.7, "Well, talk to you later?\n", 0.3, "Ok, talk to you later.\n"],
            "Nothing.\n": [0.6, "Well, talk to you later?\n", 0.4, "Ok, talk to you later.\n"],
            "Well, talk to you later?\n": [0.6, "Sure.\n", 0.4, "Ok, talk to you later.\n"],
            "Don't wanna talk.\n": [-1],
            "Ok, talk to you later.\n": [-1],
            "Sure.\n": [-1]
        };

        for(var phrase in markovChain) {
            if(this.receive_buffer.endsWith(phrase)) {
                if(markovChain[phrase][0] == -1) {
                    // Ready to close
                    this.close();
                } else {
                    let choice = Math.random();
                    while((choice -= markovChain[phrase].shift()) >= 0) {
                        markovChain[phrase].shift();
                    }

                    this.write(markovChain[phrase][0]);
                }

                break;
            }
        }
    }
}

export enum Status {
    Open, Closing, Closed
}

export default TcpConnection
