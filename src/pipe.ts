import NetworkNode from './network-node'
import NetworkPacket from './network-packet'

class Pipe {
    length: number;
    start: NetworkNode;
    end: NetworkNode;
    networkPackets: NetworkPacket[];

    constructor(start: NetworkNode, end: NetworkNode) {
        this.start = start;
        this.end = end;
        this.length = start.pos.distance(end.pos);
        this.networkPackets = [];
    }

    writePacket(packet: NetworkPacket) {
        this.networkPackets.push(packet);
    }

    tick() {
        this.networkPackets.forEach(packet => packet.progress += 2);

        const completed = this.networkPackets.filter(packet => packet.progress >= this.length);
        completed.forEach((packet) => {
            this.end.enqueuePacket(packet);
            this.networkPackets.splice(this.networkPackets.indexOf(packet), 1);
        });

        const inProgress = this.networkPackets.filter(packet => packet.progress < this.length);
        this.networkPackets = inProgress;
    }
}

export default Pipe
