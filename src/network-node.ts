import Address from './address'
import NetworkPacket from './network-packet'
import Pipe from './pipe'
import Point from './point'
import TcpConnection from './tcp-connection'

class NetworkNode {
    parent?: Pipe;
    peers: Pipe[] = [];
    children: Pipe[] = [];

    addr: Address;
    pos: Point;

    queue: NetworkPacket[] = [];
    queueSize: number = 4;
    queueTime: number = 10;

    transportLayer: Set<TcpConnection>;

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

        this.transportLayer = new Set();
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
            this.forwardPacket(packet);
            packet.progress = 0;
            this.queue.shift();
        } else {
            packet.progress += 1;
        }
    }

    forwardPacket(packet: NetworkPacket) {
        if(packet.dest.isChildOf(this.addr)) {
            if(packet.dest.equals(this.addr)) {
                this.transportLayer.forEach(transport => transport.packetReceived(packet));
            } else {
                this.children
                    .filter(child => packet.dest.isChildOf(child.end.addr))
                    .forEach(child => child.writePacket(packet))
            }
        } else {
            const relevantPeers = this.peers.filter(peer => packet.dest.isChildOf(peer.end.addr));
            if(relevantPeers.length > 0) {
                relevantPeers.forEach(peer => peer.writePacket(packet));
            } else if(this.parent) {
                this.parent.writePacket(packet);
            }
        }
    }

    distanceTo(dest: NetworkNode) {
        let dist = 0.0;
        let current: NetworkNode = this;

        while(!dest.addr.equals(current.addr)) {
            let targetPipe = null;

            if(dest.addr.isChildOf(current.addr)) {
                targetPipe = current.children.filter(child => dest.addr.isChildOf(child.end.addr))[0];
            } else {
                const relevantPeers = current.peers.filter(peer => dest.addr.isChildOf(peer.end.addr));
                if(relevantPeers.length > 0) {
                    targetPipe = relevantPeers[0];
                } else if(current.parent) {
                    targetPipe = current.parent;
                } else {
                    dist = -1;
                    break;
                }
            }

            dist += targetPipe.length;
            current = targetPipe.end;
        }

        return dist;
    }
}

export default NetworkNode
