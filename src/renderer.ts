import { BoxGeometry, Geometry, Line, LineBasicMaterial, Mesh, MeshBasicMaterial,
    PerspectiveCamera, Scene, WebGLRenderer, Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import NetworkNode from './network-node'
import Pipe from './pipe'
import Point from './point'
import TcpConnection from './tcp-connection'

const PACKET_MATERIAL = new MeshBasicMaterial( { color: "#FFFFFF" } );
const NODE_MATERIAL = new MeshBasicMaterial( { color: "#0088AA" } );
const HOST_MATERIAL = new MeshBasicMaterial( { color: "#00FFFF" } );
const PIPE_MATERIAL = new LineBasicMaterial({ color: "#00FFFF" })
const TCP_PIPE_MATERIAL = new LineBasicMaterial({ color: "#FF0000" })
const TCP_HOST_MATERIAL = new MeshBasicMaterial({ color: "#FF0000" })
const APP_PIPE_MATERIAL = new LineBasicMaterial({ color: "#00FF00" })
const APP_HOST_MATERIAL = new MeshBasicMaterial({ color: "#00FF00" })

let PACKET = new Mesh(new BoxGeometry(4, 4, 4), PACKET_MATERIAL)
let ROUTER = new Mesh(new BoxGeometry( 1, 1, 1 ), NODE_MATERIAL);
let HOST = new Mesh(new BoxGeometry( 1, 1, 1 ), HOST_MATERIAL);

const loader = new OBJLoader();
loader.load(
    'models/router.obj',
    (model) => {
        ROUTER = <Mesh>model.children[0];
        ROUTER.material = NODE_MATERIAL;
    }
);
loader.load(
    'models/host.obj',
    (model) => {
        HOST = <Mesh>model.children[0];
        HOST.material = HOST_MATERIAL;
    }
)


class Renderer {
    scene: Scene;
    camera: PerspectiveCamera;
    controls: OrbitControls;
    gfx: WebGLRenderer;

    constructor() {
        // Create an empty scene
        this.scene = new Scene();

        // Create a basic perspective camera
        this.camera = new PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 1, 10000 );
        this.controls = new OrbitControls(this.camera);
        this.camera.position.set(0, 500, 0);
        this.controls.update();

        this.gfx = new WebGLRenderer({antialias:true});
        this.gfx.setClearColor("#000000");
        this.gfx.setSize( window.innerWidth, window.innerHeight );
        document.body.appendChild( this.gfx.domElement );
    }

    render() {
        this.controls.update();
        // Render the scene
        this.gfx.render(this.scene, this.camera);
    }

    updateSimulation(root: NetworkNode) {
        this.scene.children.forEach(mesh => {
            (<Mesh>mesh).geometry.dispose();
            this.scene.remove(mesh);
        })
        this.addNode(root)
    }

    addNode(root: NetworkNode) {
        // Create a Cube Mesh with basic material
        this.addMesh(root.children.length > 0 ? ROUTER : HOST, root.pos);

        if(root.parent) {
            this.addPipe(root.parent)
        }
        root.children.forEach((pipe) => {
            this.addPipe(pipe);
            this.addNode(pipe.end);
        });
        root.peers.forEach((pipe) => {
            this.addPipe(pipe);
        })
    }

    addPipe(pipe: Pipe) {
        this.addLine(pipe, PIPE_MATERIAL);
        pipe.networkPackets.forEach(packet => this.addPacket(packet.progress, pipe));
    }

    addTcpPipe(tcp: TcpConnection) {
        const TCP_Z = 50;

        this.addLine(tcp.pipe, TCP_PIPE_MATERIAL, TCP_Z);
        this.addMesh(HOST, tcp.pipe.start.pos, TCP_HOST_MATERIAL, TCP_Z);
        this.addMesh(HOST, tcp.pipe.end.pos, TCP_HOST_MATERIAL, TCP_Z);

        tcp.pipe.networkPackets.forEach(packet => this.addPacket(packet.distanceTraveled, tcp.pipe, TCP_Z));

        const APP_Z = 100;

        this.addLine(tcp.pipe, APP_PIPE_MATERIAL, APP_Z);
        this.addMesh(HOST, tcp.pipe.start.pos, APP_HOST_MATERIAL, APP_Z);
        this.addMesh(HOST, tcp.pipe.end.pos, APP_HOST_MATERIAL, APP_Z);

        if(tcp.send_buffer.length > 0) {
            this.addPacket(tcp.sent_data / tcp.send_buffer.length * tcp.pipe.length, tcp.pipe, APP_Z);
        }
    }

    addPacket(progress: number, pipe: Pipe, z?: number) {
        const start = pointToVec(pipe.start.pos, z);
        const end = pointToVec(pipe.end.pos, z);
        const position = start.lerp(end, progress / pipe.length);

        const packetMesh = new Mesh(PACKET.geometry, PACKET.material);
        translateMesh(packetMesh, position);

        this.scene.add(packetMesh);
    }

    addLine(pipe: Pipe, material: LineBasicMaterial, z?: number) {
        const points = new Geometry();
        points.vertices.push(pointToVec(pipe.start.pos, z));
        points.vertices.push(pointToVec(pipe.end.pos, z));
        this.scene.add(new Line(points, material));
    }

    addMesh(source: Mesh, point: Point, material?: MeshBasicMaterial, z?: number) {
        let mesh = new Mesh(source.geometry, material || source.material);
        translateMesh(mesh, pointToVec(point, z));
        this.scene.add(mesh);
    }
}

function translateMesh(mesh: Mesh, vec: Vector3) {
    mesh.translateX(vec.x);
    mesh.translateY(vec.y);
    mesh.translateZ(vec.z);
}

function pointToVec(point: Point, z?: number) {
    return new Vector3(point.x, z || 0, -point.y);
}

export default Renderer
