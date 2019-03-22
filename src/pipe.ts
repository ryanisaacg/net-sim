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
        this.networkPackets.forEach(packet => packet.progress += 1);

        const completed = this.networkPackets.filter(packet => packet.progress >= this.length);
        completed.forEach(this.end.enqueuePacket);

        const inProgress = this.networkPackets.filter(packet => packet.progress < this.length);
        this.networkPackets = inProgress;
    }
}
