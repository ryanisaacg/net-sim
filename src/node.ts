class NetworkNode {
    parent?: Pipe;
    peers: Pipe[];
    children: Pipe[];

    addr: Address;
    pos: Point;

    constructor(addr: Address, pos: Point, parent?: NetworkNode) {
        this.addr = addr;
        this.pos = pos;
        if(parent) {
            this.setParent(parent);
        }
        this.peers = []
        this.children = []
    }

    setParent(parent: NetworkNode) {
        this.parent = new Pipe(this, parent);
        parent.children.push(new Pipe(parent, this));
    }

    addPeer(other: NetworkNode) {
        this.peers.push(new Pipe(this, other));
        other.peers.push(new Pipe(other, this));
    }
}
