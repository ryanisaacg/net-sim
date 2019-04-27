import { BoxGeometry, Geometry, Line, LineBasicMaterial, Mesh, MeshBasicMaterial,
    PerspectiveCamera, Scene, WebGLRenderer, Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import NetworkNode from './network-node'
import NetworkPacket from './network-packet'
import Pipe from './pipe'
import Point from './point'

const NODE_MATERIAL = new MeshBasicMaterial( { color: "#FFFFFF" } );
const HOST_MATERIAL = new MeshBasicMaterial( { color: "#666666" } );

let PACKET = new Mesh(new BoxGeometry(4, 4, 4), NODE_MATERIAL)
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

const PIPE_MATERIAL = new LineBasicMaterial({ color: "#00FFFF" })

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
            this.scene.remove(mesh);
        })
        this.addNode(root)
    }

    addNode(root: NetworkNode) {
        // Create a Cube Mesh with basic material
        const model = root.children.length > 0 ? ROUTER : HOST;
        const cube = new Mesh(model.geometry, model.material);
        translateMesh(cube, pointToVec(root.pos));

        // Add cube to Scene
        this.scene.add(cube);

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
        const points = new Geometry();
        points.vertices.push(pointToVec(pipe.start.pos));
        points.vertices.push(pointToVec(pipe.end.pos));
        this.scene.add(new Line(points, PIPE_MATERIAL));

        pipe.networkPackets.forEach(packet => this.addPacket(packet, pipe));
    }

    addPacket(packet: NetworkPacket, pipe: Pipe) {
        const start = pointToVec(pipe.start.pos);
        const end = pointToVec(pipe.end.pos);
        const position = start.lerp(end, packet.progress / pipe.length);
        console.log(position);

        const packetMesh = new Mesh(PACKET.geometry, PACKET.material);
        translateMesh(packetMesh, position);

        this.scene.add(packetMesh);
    }
}

function translateMesh(mesh: Mesh, vec: Vector3) {
    mesh.translateX(vec.x);
    mesh.translateY(vec.y);
    mesh.translateZ(vec.z);
}

function pointToVec(point: Point) {
    return new Vector3(point.x, 0, -point.y);
}

export default Renderer
