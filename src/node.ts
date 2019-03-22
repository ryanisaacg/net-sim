class NetworkNode {
    parent?: Pipe;
    peers: Pipe[] = [];
    children: Pipe[] = [];

    addr: Address;
    pos: Point;

    queue: NetworkPacket[] = [];
    queueSize: number = 4;
    queueTime: number = 2;

    // TODO: some constructor for getting an address from the parent

    constructor(addr: Address, pos: Point, parent?: NetworkNode) {
        this.addr = addr;
        this.pos = pos;
        if(parent) {
            this.setParent(parent);
        }
    }

    setParent(parent: NetworkNode) {
        this.parent = new Pipe(this, parent);
        parent.children.push(new Pipe(parent, this));
    }

    addPeer(other: NetworkNode) {
        this.peers.push(new Pipe(this, other));
        other.peers.push(new Pipe(other, this));
    }

    enqueuePacket(packet: NetworkPacket) {
        if(this.queue.length < this.queueSize) {
            packet.progress = 0;
            this.queue.push(packet);
        }
    }

    tick() {
        if(this.queue.length == 0) return;

        const packet = this.queue[0];
        if(packet.progress >= this.queueTime) {
            this.forwardPacket(packet)
        } else {
            packet.progress += 1;
        }
    }

    forwardPacket(packet: NetworkPacket) {
        if(packet.dest.isChild(this.addr)) {
            // TODO: send to child
        } else {
            // TODO: send to parent or peers
        }
    }
}
