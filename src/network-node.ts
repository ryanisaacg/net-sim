import Address from './address'
import NetworkPacket from './network-packet'
import Pipe from './pipe'

class NetworkNode {
    parent?: Pipe;
    peers: Pipe[] = [];
    children: Pipe[] = [];

    addr: Address;
    pos: Point;

    queue: NetworkPacket[] = [];
    queueSize: number = 4;
    queueTime: number = 2;

    networkCallback: (packet: NetworkPacket) => void = () => {};

    // TODO: some constructor for getting an address from the parent

    constructor(pos: Point, origin: NetworkNode | Address) {
        this.pos = pos;
        if(origin instanceof NetworkNode) {
            const parent: NetworkNode = origin;

            if(!parent.addr.local) {
                this.addr = new Address(parent.addr.region, parent.children.length + 1);
            } else if(!parent.addr.institution) {
                this.addr = new Address(parent.addr.region, parent.addr.local, parent.children.length + 1);
            } else {
                this.addr = new Address(parent.addr.region, parent.addr.local, parent.addr.institution, parent.children.length + 1);
            }

            this.setParent(parent);
        } else {
            this.addr = origin;
        }
    }

    // Buggy, only initial parent
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
        if(packet.dest.isChildOf(this.addr)) {
            if(packet.dest.equals(this.addr)) {
                this.networkCallback(packet);
            } else {
                this.children
                    .filter(child => packet.dest.isChildOf(child.end.addr))
                    .forEach(child => child.writePacket(packet))
            }
        } else {
            const relevantPeers = this.peers.filter(peer => packet.dest.isChildOf(peer.end.addr))
            if(relevantPeers.length > 0) {
                relevantPeers.forEach(peer => peer.writePacket(packet))
            } else if(this.parent) {
                this.parent.writePacket(packet)
            }
        }
    }
}

export default NetworkNode
