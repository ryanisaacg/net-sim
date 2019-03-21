class Pipe {
    length: number;
    start: NetworkNode;
    end: NetworkNode;
    network: NetworkPacket[];

    constructor(start: NetworkNode, end: NetworkNode) {
        this.start = start;
        this.end = end;
        this.length = start.pos.distance(end.pos);
        this.network = [];
    }
}
