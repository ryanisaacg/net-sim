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
                    this.close();
                }
            }
        } else if(packetType == 'D') {
            const [ seq_no, data ] = payload.split('|')
            if(+seq_no == this.receive_buffer.length) {
                this.receive_buffer += data;
                console.log('Sent ack: ' + this.receive_buffer.length)
                this.sendPacket('A' + this.receive_buffer.length);
            }
        } else if(packetType == 'F') {
            if(this.conn_status == Status.Closing) {
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
        if(this.timeout == 0 && this.sent_data != this.send_buffer.length) {
            this.sendNext();
        }
        this.pipe.networkPackets = this.pipe.networkPackets.filter(packet => packet.distanceTraveled < this.pipe.length);

        this.converse();
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
            "Hello.": [0.2, "Hello.", 0.4, "How are you?", 0.4, "What's up?"],
            "How are you?": [0.5, "Ok.", 0.1, "Not good.", 0.4, "Fine, how about you?"],
            "Ok.": [0.3, "Cool.", 0.7, "Yeah I know."],
            "Fine, how about you?": [0.8, "Ok.", 0.2, "Not good."],
            "Not good.": [0.2, "Yeah I know.", 0.8, "Oh no! What's up?"],
            "Cool.": [0.7, "Well, talk to you later?", 0.3, "Ok, talk to you later."],
            "Yeah I know.": [0.2, "Well, talk to you later?", 0.8, "Ok, talk to you later."],
            "What's up?": [0.2, "I don't know actually.", 0.5, "Nothing...", 0.3, "Don't wanna talk."],
            "I don't know actually.": [0.7, "Well, talk to you later?", 0.3, "Ok, talk to you later."],
            "Nothing.": [0.6, "Well, talk to you later?", 0.4, "Ok, talk to you later."],
            "Well, talk to you later?": [0.6, "Sure.", 0.4, "Ok, talk to you later."],
            "Don't wanna talk.": [],
            "Ok, talk to you later.": [],
            "Sure.": []
        };

        for(var phrase in markovChain) {
            if(this.receive_buffer.endsWith(phrase)) {
                if(markovChain[phrase] == []) {
                    // Ready to close
                } else {
                    let choice = Math.random();
                    while((choice -= markovChain[phrase].shift()) >= 0) {
                        markovChain[phrase].shift();
                    }

                    this.send_buffer += markovChain[phrase][0];
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
