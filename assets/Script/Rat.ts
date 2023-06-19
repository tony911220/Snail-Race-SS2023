import WaypointGraph from "./Navigation/WaypointGraph";
import Waypoint from "./Navigation/Waypoint";

const {ccclass, property} = cc._decorator;
enum Status{
    WANDER,
    CHASE
}
@ccclass
export default class Rat extends cc.Component {
    private _moveDuration = 1.5;
    private _waitDuration = 0.75;
    private _waitRandomFactor = 0.2;
    private _nextWaitTime = 0;
    private _nextMoveTime = 0;
    private _wanderVelocity = 15;
    private _chaseVelocity = 30;
    private _moveAxis2D = cc.Vec2.ZERO;
    private trackRange: number = 200;
    private anim: cc.Animation = null;
    private status: Status = Status.WANDER;
    private _minGraphEdgeLength = Infinity;
    private currentWaypoint: Waypoint = null;
    private nextWaypoint: Waypoint = null;
    @property(WaypointGraph)
    waypointGraph: WaypointGraph = null;
    @property(cc.Node)
    runTowards: cc.Node = null;

    // private _navChaser: NavChaser = null;
    // protected agentUpdate(dt: number): void {
    //     this._navChaser.update(dt);
    // }
    // @property(cc.Node)
    // runTowards: cc.Node = null;
    @property(cc.Node)
    p1: cc.Node = null;
    @property(cc.Node)
    p2: cc.Node = null;
    onLoad () {
        this.anim = this.getComponent(cc.Animation);
    }
    public distanceFromNode(node: cc.Node) {
        return node.position.sub(this.node.position).mag()
    }
    public get distanceFromTarget() {
        return this.runTowards.position.sub(this.node.position).mag();
    }
    public get towardsTarget() {
        return this.runTowards.position.sub(this.node.position).normalize();
    }
    public get towardsNextWaypoint(): cc.Vec2{
        return this.nextWaypoint.node.convertToWorldSpaceAR(cc.Vec2.ZERO).sub(this.node.convertToWorldSpaceAR(cc.Vec2.ZERO)).normalize();
    }
    public get closestWaypoint(): Waypoint {
        //#region [YOUR IMPLEMENTATION HERE]
        let min = 1e9;
        let cw = null;
        for(let j of this.waypointGraph.adjacencyList){
            if(j.distanceToNode(this.node) < min){
                min = j.distanceToNode(this.node);
                cw = j;
            }
        }
        return cw;
        //#endregion
    }
    start () {
        this._nextMoveTime = cc.director.getTotalTime() / 1000.0;
        this._nextWaitTime = this._nextMoveTime - this._waitDuration;
        for (let waypoint of this.waypointGraph.adjacencyList) {
            for (let dist of waypoint.distances) {
                this._minGraphEdgeLength = Math.min(this._minGraphEdgeLength, dist);
            }
        }
        cc.log(this._minGraphEdgeLength);
    }
    protected onTransitionFinish(): void {
        //*||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*\\
        // TODO (4.2): Complete NavChaser's onTransitionFinish method.
        // [SPECIFICATIONS]
        // - NavChaser should move towards the waypoint on the waypoint graph 
        //   closest to this._runTowards.
        // - Assign your results to this._nextWaypoint.
        //*||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*\\
       
        //#region [YOUR IMPLEMENTATION HERE]
        let minDist = this.waypointGraph.adjacencyList[0].distanceToNode(this.runTowards);
        let closetWaypointToRuntowards = this.waypointGraph.adjacencyList[0];
      
        for (let i = 1; i <= this.waypointGraph.adjacencyList.length - 1; i++) {
            if (
                minDist >
                this.waypointGraph.adjacencyList[i].distanceToNode(this.runTowards)
            ) {
                minDist = this.waypointGraph.adjacencyList[i].distanceToNode(
                this.runTowards
                );
                closetWaypointToRuntowards = this.waypointGraph.adjacencyList[i];
            }
        }
        this.nextWaypoint = this.waypointGraph.shortestPathMatrix.get(
            this.currentWaypoint.uuid + closetWaypointToRuntowards.uuid
        );
        //#endregion
        // console.log(`NavChaser: Current: ${this.currentWaypoint.node.name}, Next: ${this.nextWaypoint.node.name}`);
    }
    update (dt) {
        let currentTime = cc.director.getTotalTime() / 1000.0;
        // cc.log("current", currentTime);
        // cc.log("nextWait", this._nextWaitTime);
        // cc.log("nextMove", this._nextMoveTime);
        
        if(this.status === Status.WANDER){
            if(currentTime >= this._nextWaitTime){
                this._nextWaitTime = this._moveDuration + Math.random() * this._waitRandomFactor + this._nextMoveTime;
                this.getComponent(cc.RigidBody).linearVelocity = cc.Vec2.ZERO;
                this._moveAxis2D = cc.Vec2.ZERO;
            }
            if(currentTime >= this._nextMoveTime){
                this._nextMoveTime += this._waitDuration + this._moveDuration;
                this._moveAxis2D = randomPointOnUnitCircle();
                this.getComponent(cc.RigidBody).linearVelocity = this._moveAxis2D.mul(this._wanderVelocity);
                // cc.log(this.getComponent(cc.RigidBody).linearVelocity.x, this.getComponent(cc.RigidBody).linearVelocity.y);
                this.playAnimation();
            }
            if(this.distanceFromNode(this.p1) < this.trackRange || 
               this.distanceFromNode(this.p2) < this.trackRange){
                this.status = Status.CHASE;
                this.currentWaypoint = this.closestWaypoint;
                this.nextWaypoint = this.closestWaypoint;
            }
        }else{
            if(this.distanceFromNode(this.p1) > this.trackRange && 
               this.distanceFromNode(this.p2) > this.trackRange){
                this.status = Status.WANDER;
            }else{
                if(this.distanceFromNode(this.p1) < this.distanceFromNode(this.p2)){
                    this.runTowards = this.p1;
                }else{
                    this.runTowards = this.p2;
                }
                this.onTransitionFinish();
                if (this.distanceFromTarget < this._minGraphEdgeLength) {
                    cc.log("within same waypoint of player");
                    this.nextWaypoint
                    this._moveAxis2D.x = this.towardsTarget.x;
                    this._moveAxis2D.y = this.towardsTarget.y;
                } else {
                    if (this.currentWaypoint === this.nextWaypoint) {
                        cc.log("reach next waypoint");
                        this._moveAxis2D = cc.Vec2.ZERO;
                    } else {
                        this._moveAxis2D = this.towardsNextWaypoint;
                    }
                }
                this.getComponent(cc.RigidBody).linearVelocity = this._moveAxis2D.mul(this._chaseVelocity);
            }
        }
        this.playAnimation();
    }
    playAnimation(){
        if(this._moveAxis2D.x > 0 && Math.abs(this._moveAxis2D.x) > Math.abs(this._moveAxis2D.y)){
            if(!this.anim.getAnimationState("walkRight").isPlaying){
                this.anim.play("walkRight");
            }
            this.node.scaleX = 1;
        }else if(this._moveAxis2D.x < 0 && Math.abs(this._moveAxis2D.x) > Math.abs(this._moveAxis2D.y)){
            if(!this.anim.getAnimationState("walkRight").isPlaying){
                this.anim.play("walkRight");
            }
            this.node.scaleX = -1;
        }else if(this._moveAxis2D.y > 0){
            if(!this.anim.getAnimationState("walkTop").isPlaying){
                this.anim.play("walkTop");
            }
            this.node.scaleX = 1;
        }else if(this._moveAxis2D.y < 0){
            if(!this.anim.getAnimationState("walkDown").isPlaying){
                this.anim.play("walkDown");
            }
            this.node.scaleX = 1;
        }

    }
}
function randomPointOnUnitCircle() {
    let angle = Math.random() * Math.PI * 2;
    return new cc.Vec2(Math.cos(angle), Math.sin(angle));
}