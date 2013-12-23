////////////////////////////////////////////////////////////////////////////////
// View pipeline demo
////////////////////////////////////////////////////////////////////////////////

/*global THREE, document, window, sprintf, Coordinates, requestAnimationFrame, dat*/

/*
	I used this as a starting spot:
	http://stemkoski.github.io/Three.js/Sprite-Text-Labels.html
	Three.js "tutorials by example"
	Author: Lee Stemkoski
*/

// MAIN

// standard global variables
var container, scene, camera, renderer, controls, effectController;
var canvasWidth, canvasHeight;
var sceneGrid, cameraGrid, sceneText;
var frustumCam, frustumTarget;
var sceneFrustum;

// custom global variables
var cube, corner, cornerGeometry;
var helpSprite;
var light, ambientLight;
var groundGrid, moreGround, axis1, axis2, xGrid, zGrid;
var spritey = [];
var sphereMaterial, cubeMaterial;
var fullWireMaterial, lineMaterial, nearLineMaterial, farLineMaterial;

var viewMode;

// tasty fudge:
var TEXT_SCALE = 0.77;
var EXTRA_CUSHION = 3;

var boxSize;
var clearColor = 0xfffaf3;

var prevMatrixWorld = new THREE.Matrix4();
var prevPtm = new THREE.Vector4();
var prevMatrixWorldInverse = new THREE.Matrix4();
var prevPtv = new THREE.Vector4();
var prevProjectionMatrix = new THREE.Matrix4();
var prevPtvp = new THREE.Vector4();
var prevPtndc = new THREE.Vector4();
var prevWindowMatrix = new THREE.Matrix4();
var prevPtpix = new THREE.Vector4();

var EPSILON = 0.00001;

function init() 
{
	boxSize = new THREE.Vector3(8,10,6);

	// SCENE
	scene = new THREE.Scene();
	sceneFrustum = new THREE.Scene();
	sceneText = new THREE.Scene();

	// if not a subwindow inside a window:
	//canvasWidth = window.innerWidth;
	//canvasHeight = window.innerHeight;
	
    var headerElement = document.getElementById( "myID" );

    canvasWidth = window.innerWidth;
    canvasHeight = window.innerHeight - headerElement.offsetHeight;
	
	// RENDERER
	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.gammaInput = true;
	renderer.gammaOutput = true;
	renderer.setSize(canvasWidth, canvasHeight);
	renderer.setClearColorHex( clearColor, 1.0 );
	// don't clear when multiple viewports are drawn
	renderer.autoClear = false;

	container = document.getElementById('container');
	container.appendChild( renderer.domElement );

	// CAMERA
	var aspect = canvasWidth / canvasHeight;
	camera = new THREE.PerspectiveCamera( effectController.fov, aspect, effectController.near, effectController.far);
	camera.position.set(-21,24,31);
	//camera.lookAt(scene.position);
	
	frustumTarget = new THREE.Vector3();
	frustumTarget.set(0,0,0);

	frustumCam = new THREE.PerspectiveCamera( 45, aspect, 10, 110 );
	frustumCam.position.set( -21,24,31 );
	frustumCam.lookAt( new THREE.Vector3( 0, 0, 0 ) );

	// CONTROLS
	controls = new THREE.OrbitAndPanControls( camera, renderer.domElement );
	controls.target.set(0,0,0);

	// EVENTS
	window.addEventListener( 'resize', onWindowResize, false );

	// LIGHT
	light = new THREE.PointLight(0xffffff);
	light.position.set(0,25,0);
	scene.add(light);

	ambientLight = new THREE.AmbientLight( 0xd5d5d5 );
	scene.add(ambientLight);
	///////////////////////
	// GROUND
	
	/*var solidGround = new THREE.Mesh(
		new THREE.PlaneGeometry( 100, 100 ),
		new THREE.MeshPhongMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.7,
			// polygonOffset moves the plane back from the eye a bit, so that the lines on top of
			// the grid do not have z-fighting with the grid:
			// Factor == 1 moves it back relative to the slope (more on-edge means move back farther)
			// Units == 4 is a fixed amount to move back, and 4 is usually a good value
			polygonOffset: true, polygonOffsetFactor: 1.0, polygonOffsetUnits: 4.0
		}));
	solidGround.rotation.x = -Math.PI / 2;
	*/

	//scene.add( solidGround );

	lineMaterial = new THREE.LineBasicMaterial( { color: 0x0 } );
	nearLineMaterial = new THREE.LineBasicMaterial( { color: 0x228822 } );
	farLineMaterial = new THREE.LineBasicMaterial( { color: 0xff55ff } );

	fullWireMaterial = new THREE.MeshLambertMaterial( { color: 0x00000000, wireframe: true } );
	groundGrid = new THREE.Mesh(
		new THREE.PlaneGeometry( 100, 100, 10, 10 ), fullWireMaterial );
	groundGrid.rotation.x = - Math.PI / 2;

	scene.add( groundGrid );

	moreGround = new THREE.Mesh(
		new THREE.PlaneGeometry( 20, 20, 20, 20 ), fullWireMaterial );
	moreGround.rotation.x = - Math.PI / 2;

	scene.add( moreGround );
	
	// thicker axes
	axis1 = new THREE.Mesh( 
		new THREE.CylinderGeometry( 0.05, 0.05, 10, 8, 1, true ), fullWireMaterial );
	axis1.rotation.z = 90 * Math.PI/180;
	axis1.position.x = -5;
	scene.add( axis1 );

	axis2 = new THREE.Mesh( 
		new THREE.CylinderGeometry( 0.05, 0.05, 10, 8, 1, true ), fullWireMaterial );
	axis2.rotation.x = -90 * Math.PI/180;
	axis2.position.z = -5;
	scene.add( axis2 );

	// vertical grids
	xGrid = new THREE.Mesh(
		new THREE.PlaneGeometry( 20, 10, 20, 10 ),
		new THREE.MeshBasicMaterial( { color: 0xaa0000, wireframe: true } ) );
	xGrid.rotation.y = - Math.PI / 2;
	xGrid.position.y = 5;

	scene.add( xGrid );

	zGrid = new THREE.Mesh(
		new THREE.PlaneGeometry( 20, 10, 20, 10 ),
		new THREE.MeshBasicMaterial( { color: 0x0000aa, wireframe: true } ) );
	zGrid.position.y = 5;

	scene.add( zGrid );

	Coordinates.drawAllAxes({axisLength:16.2,axisRadius:0.1,axisTess:50});
	

	////////////
	// CUSTOM //
	////////////
	
	var cubeGeometry = new THREE.CubeGeometry( boxSize.x, boxSize.y, boxSize.z );
	cubeMaterial = new THREE.MeshLambertMaterial( { color: 0xff99ff, ambient: 0xff99ff } );
	cube = new THREE.Mesh( cubeGeometry, cubeMaterial );
	cube.position.set(0,boxSize.y/2,0);
	cube.name = "Cube";
	scene.add(cube);
	
	cornerGeometry = new THREE.SphereGeometry( 0.3 );
	sphereMaterial = new THREE.MeshBasicMaterial( { color: 0xffaa00 } );
	corner = new THREE.Mesh( cornerGeometry, sphereMaterial );
	corner.position.set(-boxSize.x/2,boxSize.y/2,boxSize.z/2);
	corner.name = "corner";
	cube.add(corner);
	
	createHelp();
	createText( true );
	createGridScene();
}

function createGridScene() {
	// SCENE
	sceneGrid = new THREE.Scene();

	// CAMERA
	cameraGrid = new THREE.OrthographicCamera( -0.5*canvasWidth, 0.5*canvasWidth, -0.5*canvasHeight, 0.5*canvasHeight, -0.5, 0.5 );
	sceneGrid.add(cameraGrid);
	
	var ndcGrid = new THREE.Mesh(
		new THREE.PlaneGeometry( canvasWidth, canvasHeight, 8, 8 ),
		new THREE.MeshBasicMaterial( { color: 0x0, wireframe: true } ) );
	//groundGrid.rotation.x = - Math.PI / 2;
	sceneGrid.add(ndcGrid);
	
	
	/* someday figure out how to add labels to NDC
	- needs to work on resize, too.
	var messageList = [];
	messageList[0] = "-1.0,-1.0";
	var label = makeTextSprite( messageList, 
			{ 	fill: false,
				showRect: false,
				spriteAlignment : THREE.SpriteAlignment.center,
				useScreenCoordinates: true 
				} 
			);
	label.position.set(canvasWidth/2,1.3*canvasHeight,0);
	sceneGrid.add( label );
	*/
}

// EVENT HANDLERS

function onWindowResize() {

	//canvasWidth = window.innerWidth;
	//canvasHeight = window.innerHeight;

    var headerElement = document.getElementById( "myID" );

    canvasWidth = window.innerWidth;
    canvasHeight = window.innerHeight - headerElement.offsetHeight;

	renderer.setSize( canvasWidth, canvasHeight );

	camera.aspect = canvasWidth / canvasHeight;
	camera.updateProjectionMatrix();
	
	removeHelp();
	createHelp();
}

function makeTextSprite( messageList, parameters )
{
	if ( parameters === undefined ) parameters = {};
	var metrics;
	
	var fontface = parameters.hasOwnProperty("fontface") ? 
		parameters.fontface : "Courier New";
	
	var fontsize = parameters.hasOwnProperty("fontsize") ? 
		parameters.fontsize : 16;
	
	var borderThickness = parameters.hasOwnProperty("borderThickness") ? 
		parameters.borderThickness : 1.5;
	
	var borderColor = parameters.hasOwnProperty("borderColor") ?
		parameters.borderColor : { r:0, g:0, b:0, a:1.0 };
	
	var textColor = parameters.hasOwnProperty("textColor") ?
		parameters.textColor : { r:60, g:60, b:60, a:1.0 };

	var highlightColor = parameters.hasOwnProperty("highlightColor") ?
		parameters.highlightColor : { r:0, g:0, b:0, a:1.0 };

	var backgroundColor = parameters.hasOwnProperty("backgroundColor") ?
		parameters.backgroundColor : { r:0, g:0, b:0, a:1.0 };

	var useScreenCoordinates = parameters.hasOwnProperty("useScreenCoordinates") ?
		parameters.useScreenCoordinates : false ;

	var spriteAlignment = parameters.hasOwnProperty("spriteAlignment") ?
		parameters.spriteAlignment : THREE.SpriteAlignment.topLeft ;

	var textAlignment = parameters.hasOwnProperty("textAlignment") ?
		parameters.textAlignment : 'left' ;

	var fill = parameters.hasOwnProperty("fill") ?
		parameters.fill : true ;
		
	var showRect = parameters.hasOwnProperty("showRect") ?
		parameters.showRect : true ;
		
	var canvas = document.createElement('canvas');
	canvas.width  = 620;
	canvas.height = 620;
	var context = canvas.getContext('2d');
	context.font = "Bold " + fontsize + "px " + fontface;
    
	// border color
	context.strokeStyle = "rgba(" + borderColor.r + "," + borderColor.g + ","
			+ borderColor.b + "," + borderColor.a + ")";

	var offsetx = 0;

	for ( var mchunk = 0; mchunk < messageList.length; mchunk++ )
	{
		var dofill = true;
		var message = messageList[mchunk];

		// find number of lines in text message
		var rawStringList = [];
		rawStringList = message.split("\n");
		var lines = rawStringList.length;
			
		// normal text, so remove all inside * *
		var normalText = 1;

		var normalStringList = [];
		var highlightStringList = [];
		// make a list with no "*" in it, so we can get line lengths
		var cleanStringList = [];
		for ( var ln = 0; ln < rawStringList.length; ln++ )
		{
			var buffer = rawStringList[ln];
			normalStringList[ln] = "";
			highlightStringList[ln] = "";
			cleanStringList[ln] = "";
			for ( var chpos = 0; chpos < buffer.length; chpos++ )
			{
				if ( buffer.charAt(chpos) == '=' )
					dofill = false;

				if ( buffer.charAt(chpos) == '*' )
				{
					normalText = 1 - normalText;
				}
				else
				{
					cleanStringList[ln] += buffer.charAt(chpos);
					if ( normalText )
					{
						normalStringList[ln] += buffer.charAt(chpos);
						highlightStringList[ln] += " ";
					}
					else
					{
						normalStringList[ln] += " ";
						highlightStringList[ln] += buffer.charAt(chpos);
					}
				}
			}
		}
		if ( dofill )
		{
			context.font = "Bold " + fontsize + "px " + fontface;
		}
		else
		{
			// if no rectangle surrounds, make text faster.
			context.font = "Bold " + 1.5*fontsize + "px " + fontface;
		}
		
		var textWidth = -99;
		for ( var i = 0; i < cleanStringList.length; i++ )
		{
			// get size data (height depends only on font size)
			metrics = context.measureText( cleanStringList[i] );
			if ( metrics.width > textWidth )
				textWidth = metrics.width;
		}
		
		if ( showRect && dofill )
		{
			context.lineWidth = borderThickness;
			context.fillStyle = "rgba(" + backgroundColor.r + "," + backgroundColor.g + ","
					+ backgroundColor.b + "," + backgroundColor.a + ")";
			// 1.2 + 0.2 is extra height factor for text below baseline: g,j,p,q.
			roundRect(context, offsetx, borderThickness/2, borderThickness/2, textWidth + borderThickness + 2*EXTRA_CUSHION,
					fontsize * (1.2 * lines + 0.2) + borderThickness + 2*EXTRA_CUSHION, 6, fill);
		}
			
		for ( var style = 0; style < 2; style++ )
		{
			// text color
			if ( style === 0 )
			{
				context.fillStyle = "rgba(" + textColor.r + "," + textColor.g + ","
						+ textColor.b + "," + textColor.a + ")";
			}
			else
			{
				context.fillStyle = "rgba(" + highlightColor.r + "," + highlightColor.g + ","
						+ highlightColor.b + "," + highlightColor.a + ")";
			}

			for ( i = 0; i < cleanStringList.length; i++ )
			{
				metrics = context.measureText( cleanStringList[i] );
				context.fillText( style ? highlightStringList[i] : normalStringList[i],
						offsetx + borderThickness + EXTRA_CUSHION + (textAlignment == 'right' ? textWidth - metrics.width : 0),
						(i+1)*(fontsize*1.2) + borderThickness + EXTRA_CUSHION);
			}
			
		}
		// reset to default font size
		context.font = "Bold " + fontsize + "px " + fontface;
		offsetx += textWidth + 2.5*borderThickness + 2*EXTRA_CUSHION;
	}
	
	// canvas contents will be used for a texture
	var texture = new THREE.Texture(canvas);
	texture.needsUpdate = true;

	var spriteMaterial = new THREE.SpriteMaterial( 
		{ map: texture, useScreenCoordinates: false, alignment: spriteAlignment } );
	spriteMaterial.useScreenCoordinates = useScreenCoordinates;
	spriteMaterial.depthTest = false;
	spriteMaterial.sizeAttenuation = true;
	var sprite = new THREE.Sprite( spriteMaterial );

	var diff = new THREE.Vector3();
	diff.copy( camera.position );
	diff.sub( controls.target );
	var scale = ( useScreenCoordinates ? 1.0 : diff.length() ) * TEXT_SCALE ;
	sprite.scale.set(scale,scale,1.0);
	return sprite;	
}

// function for drawing rounded rectangles
function roundRect(ctx, offsetx, x, y, w, h, r, fill) 
{
    ctx.beginPath();
    ctx.moveTo(offsetx+x+r, y);
    ctx.lineTo(offsetx+x+w-r, y);
    ctx.quadraticCurveTo(offsetx+x+w, y, offsetx+x+w, y+r);
    ctx.lineTo(offsetx+x+w, y+h-r);
    ctx.quadraticCurveTo(offsetx+x+w, y+h, offsetx+x+w-r, y+h);
    ctx.lineTo(offsetx+x+r, y+h);
    ctx.quadraticCurveTo(offsetx+x, y+h, offsetx+x, y+h-r);
    ctx.lineTo(offsetx+x, y+r);
    ctx.quadraticCurveTo(offsetx+x, y, offsetx+x+r, y);
    ctx.closePath();
	// doesn't work with multiple fills
    if ( fill ) ctx.fill();
	ctx.stroke();   
}

function animate() 
{
    requestAnimationFrame( animate );
	render();		
}

function setVector4Highlights( pt, prevPt, hl )
{
	hl[0] = hl[1] = ( Math.abs(pt.x - prevPt.x ) < EPSILON ) ? "" : "*";
	hl[2] = hl[3] = ( Math.abs(pt.y - prevPt.y ) < EPSILON ) ? "" : "*";
	hl[4] = hl[5] = ( Math.abs(pt.z - prevPt.z ) < EPSILON ) ? "" : "*";
	hl[6] = hl[7] = ( Math.abs(pt.w - prevPt.w ) < EPSILON ) ? "" : "*";
}
function setHighlights( val, prevVal, hl )
{
	hl[0] = hl[1] = ( Math.abs(val - prevVal ) < EPSILON ) ? "" : "*";
}

function setTextVisibility( visible )
{
	for ( var i = 0; i < spritey.length; i++ )
	{
		spritey[i].visible = visible;
	}
}

function removeText()
{
	for ( var i = 0; i < spritey.length; i++ )
	{
		sceneText.remove( spritey[i] );
	}
}

function createHelp()
{
	var message =
		[	'This demo shows how a single vertex','of a box, marked with an orange dot,',
			'is transformed by the rendering pipeline.','Red numbers are those that change.',
			'Each transform is shown in OpenGL/WebGL','order: the untransformed vector is',
			'on the right, the matrix multiplies it,','and the resulting vector is on the left.',
			'The box begins transformed up by 5 units.',
			'XYZ axes are marked with RGB arrows.',
		].join('\n');
	var messageList = [];
	messageList[0] = message;
	helpSprite = makeTextSprite( messageList, 
		{ fontsize: 24, fontface: "Georgia", borderColor: {r:0, g:186, b:0, a:1.0}, 
			textColor: {r:0, g:0, b:0, a:1.0}, highlightColor: {r:255, g:0, b:0, a:1.0},
			backgroundColor: {r:255, g:255, b:255, a:0.9},
			useScreenCoordinates: true, spriteAlignment: THREE.SpriteAlignment.centerLeft,
			fill: true } );
	// TODO: bottomRight text alignment doesn't work as advertised, so center seems to be OK.
	helpSprite.position.set( canvasWidth - 0.70*canvasHeight, canvasHeight, 0.5 );
	sceneText.add( helpSprite );	
}

function removeHelp()
{
	sceneText.remove( helpSprite );
}

function displayHelp()
{
	helpSprite.visible = effectController.help;
}

function displayGrid()
{
	groundGrid.visible = moreGround.visible = 
		axis1.visible = axis2.visible = effectController.grid;
	xGrid.visible = effectController.xgrid;
	zGrid.visible = effectController.zgrid;
}
function matrixMatch( mtx1, mtx2 )
{
	for ( var i = 0; i < 16; i++ ){
		if ( mtx1.elements[i] != mtx2.elements[i] )
			return false;
	}
	return true;
}

function createText( force )
{
	displayHelp();
	displayGrid();

	var pt = new THREE.Vector4( -boxSize.x/2,boxSize.y/2,boxSize.z/2);	// corner location
	var ptm = new THREE.Vector4();
	ptm.copy(pt);
	ptm.applyMatrix4(cube.matrixWorld);	

	var ptv = new THREE.Vector4();
	ptv.copy(ptm);
	ptv.applyMatrix4(camera.matrixWorldInverse);
	
	var ptvp = new THREE.Vector4();
	ptvp.copy(ptv);
	ptvp.applyMatrix4(camera.projectionMatrix);
	
	var ptndc = new THREE.Vector4();
	ptndc.copy(ptvp);
	ptndc.divideScalar(ptvp.w);

	var windowMatrix = new THREE.Matrix4(
		canvasWidth/2, 0, 0, canvasWidth/2,
		0, canvasHeight/2, 0, canvasHeight/2, 
		0, 0, 0.5, 0.5,
		0, 0, 0, 1);
	var ptpix = new THREE.Vector4();
	ptpix.copy(ptndc);
	ptpix.applyMatrix4(windowMatrix);
	
	// if there is no change from the previous
	if ( !force )
	{
		// check previous values
		if ( matrixMatch( prevMatrixWorld, cube.matrixWorld ) &&
			prevPtm.equals( ptm ) &&
			matrixMatch( prevMatrixWorldInverse, camera.matrixWorldInverse ) &&
			prevPtv.equals( ptv ) &&
			matrixMatch( prevProjectionMatrix, camera.projectionMatrix ) &&
			prevPtvp.equals( ptvp ) &&
			prevPtndc.equals( ptndc ) &&
			matrixMatch( prevWindowMatrix, windowMatrix ) &&
			prevPtpix.equals( ptpix ) )
		{
			// nothing changed, don't update
			return;
		}
	}
	// remove old sprite(s)
	removeText();
	

	var anchor = new THREE.Vector4();
	anchor.copy(ptm);
	
	
	var myfontsize = 16;
	
	var hl = [];
	
	var screenlock = false;
	var displayList = [ viewMode ];
	if ( viewMode == 'all' )
	{
		displayList = [ 'model', 'view', 'projection', 'window' ];
		screenlock = true;
	}
	
	var messageList = [];

	for ( var modenum = 0; modenum < displayList.length; modenum++ )
	{
		// hard-wired offset
		if ( screenlock )
			anchor.set(10, 10 + modenum*canvasHeight/5, 0.5);
			
		messageList = [];	// clear each time
		var i = 0;
		var c,r;

		switch ( displayList[modenum] )
		{
		default:
		case 'model':
			messageList[i] = " world-space \n point\n";
			setVector4Highlights( ptm, prevPtm, hl );
			messageList[i] += sprintf( "%s%9.2f%s\n%s%9.2f%s\n%s%9.2f%s\n%s%6.0f%s",
					hl[0], ptm.x, hl[1], hl[2], ptm.y, hl[3], hl[4], ptm.z, hl[5], hl[6], ptm.w, hl[7]  );
			i++;

			messageList[i] = "\n\n\n=";
			i++;

			messageList[i] = " Model (World) Matrix \n\n";
			for ( c = 0; c < 4; c++ ) {
				for ( r = 0; r < 4; r++ ) {
					setHighlights( cube.matrixWorld.elements[r*4+c], prevMatrixWorld.elements[r*4+c], hl );
					messageList[i] += sprintf( "%s%6.2f%s", hl[0], cube.matrixWorld.elements[r*4+c], hl[1] );
					//if ( r < 3 )
						messageList[i] += " ";
				}
				if ( c < 3 )
					messageList[i] += "\n";
			}
			i++;
			
			// note: no highlighting done, as it's not needed - values never change
			messageList[i] = " model \n point\n";
			messageList[i] += sprintf( "%6.2f\n%6.2f\n%6.2f\n%3.0f  ", pt.x, pt.y, pt.z, pt.w );
			i++;
			break;
		
		case 'view':
			messageList[i] = " view-space \n point\n";
			setVector4Highlights( ptv, prevPtv, hl );
			messageList[i] += sprintf( "%s%9.2f%s\n%s%9.2f%s\n%s%9.2f%s\n%s%6.0f%s",
					hl[0], ptv.x, hl[1], hl[2], ptv.y, hl[3], hl[4], ptv.z, hl[5], hl[6], ptv.w, hl[7]  );
			i++;

			messageList[i] = "\n\n\n=";
			i++;

			messageList[i] = " View Matrix\n\n";
			for ( c = 0; c < 4; c++ ) {
				for ( r = 0; r < 4; r++ ) {
					setHighlights( camera.matrixWorldInverse.elements[r*4+c], prevMatrixWorldInverse.elements[r*4+c], hl );
					messageList[i] += sprintf( "%s%7.2f%s", hl[0], camera.matrixWorldInverse.elements[r*4+c], hl[1] );
				}
				if ( c < 3 )
					messageList[i] += " \n";
			}
			i++;
			
			messageList[i] = " world\n\n";
			setVector4Highlights( ptm, prevPtm, hl );
			messageList[i] += sprintf( "%s%6.2f%s \n%s%6.2f%s \n%s%6.2f%s \n%s%3.0f%s   ",
					hl[0], ptm.x, hl[1], hl[2], ptm.y, hl[3], hl[4], ptm.z, hl[5], hl[6], ptm.w, hl[7]  );
			i++;
			break;
		
		case 'projection':
			messageList[i] = " W-divide \n for NDC \n";
			setVector4Highlights( ptndc, prevPtndc, hl );
			messageList[i] += sprintf( "%s%7.3f%s\n%s%7.3f%s\n%s%7.3f%s\n%s%3.0f%s ",
					hl[0], ptndc.x, hl[1], hl[2], ptndc.y, hl[3], hl[4], ptndc.z, hl[5], hl[6], ptndc.w, hl[7]  );
			i++;

			messageList[i] = "\n\n\n<=";
			i++;

			if ( ptndc.x < -1 || ptndc.x > 1 || ptndc.y < -1 || ptndc.y > 1 || ptndc.z < -1 || ptndc.z > 1 )
			{
				messageList[i] = " *clip* \n";
				sphereMaterial.color.set( 0xff0000 );
			}
			else
			{
				messageList[i] = " clip \n";
				sphereMaterial.color.set( 0xffaa00 );
			}
			messageList[i] += " coords \n";
			setVector4Highlights( ptvp, prevPtvp, hl );
			messageList[i] += sprintf( "%s%6.2f%s\n%s%6.2f%s\n%s%6.2f%s\n%s%6.2f%s ",
					hl[0], ptvp.x, hl[1], hl[2], ptvp.y, hl[3], hl[4], ptvp.z, hl[5], hl[6], ptvp.w, hl[7]  );
			i++;

			messageList[i] = "\n\n\n=";
			i++;

			messageList[i] = " Projection Matrix\n\n";
			for ( c = 0; c < 4; c++ ) {
				setHighlights( camera.projectionMatrix.elements[c], prevProjectionMatrix.elements[c], hl );
				messageList[i] += sprintf( "%s%6.2f%s", hl[0], camera.projectionMatrix.elements[c], hl[1] );
				setHighlights( camera.projectionMatrix.elements[4+c], prevProjectionMatrix.elements[4+c], hl );
				messageList[i] += sprintf( "%s%6.2f%s", hl[0], camera.projectionMatrix.elements[4+c], hl[1] );
				setHighlights( camera.projectionMatrix.elements[8+c], prevProjectionMatrix.elements[8+c], hl );
				messageList[i] += sprintf( "%s%7.2f%s", hl[0], camera.projectionMatrix.elements[8+c], hl[1] );
				setHighlights( camera.projectionMatrix.elements[12+c], prevProjectionMatrix.elements[12+c], hl );
				messageList[i] += sprintf( "%s%7.2f%s ", hl[0], camera.projectionMatrix.elements[12+c], hl[1] );

				if ( c < 3 )
					messageList[i] += "\n";
			}
			i++;
			
			messageList[i] = " view\n point\n";
			setVector4Highlights( ptv, prevPtv, hl );
			messageList[i] += sprintf( "%s%6.2f%s \n%s%6.2f%s \n%s%6.2f%s \n%s%3.0f%s ",
					hl[0], ptv.x, hl[1], hl[2], ptv.y, hl[3], hl[4], ptv.z, hl[5], hl[6], ptv.w, hl[7]  );
			i++;
			break;

		case 'window':
			// NDC to pixel
			messageList[i] = " window \n coords\n";
			setVector4Highlights( ptpix, prevPtpix, hl );
			messageList[i] += sprintf( "%s%7.1f%s\n%s%7.1f%s\n%s%7.3f%s\n%s%4.0f%s ",
					hl[0], ptpix.x, hl[1], hl[2], ptpix.y, hl[3], hl[4], ptpix.z, hl[5], hl[6], ptpix.w, hl[7]  );
			i++;

			messageList[i] = "\n\n\n=";
			i++;

			messageList[i] = " Window (Screen) Matrix\n\n";
			for ( c = 0; c < 4; c++ ) {
				setHighlights( windowMatrix.elements[c], prevWindowMatrix.elements[c], hl );
				messageList[i] += sprintf( "%s%7.2f%s", hl[0], windowMatrix.elements[c], hl[1] );
				setHighlights( windowMatrix.elements[4+c], prevWindowMatrix.elements[4+c], hl );
				messageList[i] += sprintf( "%s%7.2f%s", hl[0], windowMatrix.elements[4+c], hl[1] );
				setHighlights( windowMatrix.elements[8+c], prevWindowMatrix.elements[8+c], hl );
				messageList[i] += sprintf( "%s%5.2f%s", hl[0], windowMatrix.elements[8+c], hl[1] );
				setHighlights( windowMatrix.elements[12+c], prevWindowMatrix.elements[12+c], hl );
				messageList[i] += sprintf( "%s%7.2f%s ", hl[0], windowMatrix.elements[12+c], hl[1] );

				if ( c < 3 )
					messageList[i] += "\n";
			}
			i++;
			
			messageList[i] = " NDC  \n\n";
			setVector4Highlights( ptndc, prevPtndc, hl );
			messageList[i] += sprintf( "%s%7.3f%s \n%s%7.3f%s \n%s%7.3f%s \n%s%3.0f%s ",
					hl[0], ptndc.x, hl[1], hl[2], ptndc.y, hl[3], hl[4], ptndc.z, hl[5], hl[6], ptndc.w, hl[7]  );
			i++;
			break;
		
		/* for debugging, check out reverse of transforms */
		case 'debug':
			/*
			// NDC to pixel
			myfontsize = 9;
			//anchor.copy(view2world);
			anchor.set(10.1, 10.1, 0.5);

			// get the world-space location for pixel 20, height-20
			var screenLoc = new THREE.Vector4( 20, canvasHeight-20, 0.2, 1 );
			var invMatrix = new THREE.Matrix4();
			invMatrix.getInverse( windowMatrix );
			
			var screen2ndc = new THREE.Vector4();
			screen2ndc.copy(screenLoc);
			screen2ndc.applyMatrix4(invMatrix);
			invMatrix.getInverse( camera.projectionMatrix );
			
			var ndc2view = new THREE.Vector4();
			ndc2view.copy(screen2ndc);
			ndc2view.applyMatrix4(invMatrix);
			ndc2view.divideScalar(ndc2view.w);
			
			var view2world = new THREE.Vector4();
			view2world.copy(ndc2view);
			view2world.applyMatrix4(camera.matrixWorld);
			
			messageList[i] = "window coordinates     \n";
			messageList[i] += sprintf( "%7.2f%8.2f%7.3f%6.1f \n", screenLoc.x, screenLoc.y, screenLoc.z, screenLoc.w );
			messageList[i] += "NDC coordinates       \n";
			messageList[i] += sprintf( "%7.2f%8.2f%7.3f%6.1f \n", screen2ndc.x, screen2ndc.y, screen2ndc.z, screen2ndc.w );
			messageList[i] += "view coordinates       \n";
			messageList[i] += sprintf( "%7.2f%8.2f%7.3f%6.1f \n", ndc2view.x, ndc2view.y, ndc2view.z, ndc2view.w );
			messageList[i] += "world coordinates       \n";
			messageList[i] += sprintf( "%7.2f%8.2f%7.3f%6.1f ", view2world.x, view2world.y, view2world.z, view2world.w );
			i++;
			*/

			break;
		}
		
		spritey[modenum] = makeTextSprite( messageList, 
			{ fontsize: myfontsize, fontface: "Courier New", borderColor: {r:0, g:0, b:255, a:1.0}, 
				textColor: {r:50, g:50, b:50, a:1.0}, highlightColor: {r:255, g:0, b:0, a:1.0},
				backgroundColor: {r:255, g:255, b:255, a:0.8},
				fill: true,
				useScreenCoordinates: (viewMode == 'all') ? true : false } );
		
		spritey[modenum].position.copy(anchor);
		if ( viewMode != 'all' )
		{
			spritey[modenum].position.x -= 0.5;
			//spritey.position.y += 0.5;
			spritey[modenum].position.z += 0.5;
			//spritey.renderDepth = 0.05;
		}
		sceneText.add( spritey[modenum] );
	}

	prevMatrixWorld.copy( cube.matrixWorld );
	prevPtm.copy( ptm );
	prevMatrixWorldInverse.copy( camera.matrixWorldInverse );
	prevPtv.copy( ptv );
	prevProjectionMatrix.copy( camera.projectionMatrix );
	prevPtvp.copy( ptvp );
	prevPtndc.copy( ptndc );
	prevWindowMatrix.copy( windowMatrix );
	prevPtpix.copy( ptpix );
}

function createFrustum( pointsForDepth )
{
	// lazy way to clear scene - is there a better way?
	sceneFrustum = new THREE.Scene();

	var eyeGeometry = new THREE.SphereGeometry( 4*0.3 );
	var eyeMaterial = new THREE.MeshBasicMaterial( { color: 0x00dddd } );
	var eyeSphere = new THREE.Mesh( eyeGeometry, eyeMaterial );
	eyeSphere.position.copy( camera.position );
	sceneFrustum.add(eyeSphere);
	
	// draw 12 lines:
	// 4 for frustum edges
	// 4 for near
	// 4 for far
	
	var frustumPoints = [];
	var world = new THREE.Vector4();
	var v,x,y,z;
	for ( x = 0; x <= 1; x++ )
	{
		for ( y = 0; y <= 1; y++ )
		{
			for ( z = 0; z < pointsForDepth; z++ )
			{
				var ndc = new THREE.Vector4( x*2-1, y*2-1, (z/(pointsForDepth-1))*2-1 );
				getWorldLocation( ndc, world );
				frustumPoints[x*2*pointsForDepth + y*pointsForDepth + z] = new THREE.Vector3( world.x, world.y, world. z );
			}
		}
	}
	
	// frustum edges
	for ( x = 0; x <= 1; x++ )
	{
		for ( y = 0; y <= 1; y++ )
		{
			var geometry = new THREE.Geometry();
			geometry.vertices.push( camera.position );
			geometry.vertices.push( frustumPoints[x*2*pointsForDepth + y*pointsForDepth + pointsForDepth-1] );

			var line = new THREE.Line( geometry, lineMaterial );
			sceneFrustum.add( line );
		}
	}
	
	// planes
	for ( z = 0; z < pointsForDepth; z++ )
	{
		var geometry = new THREE.Geometry();
		for ( v = 0; v < 5; v++ )
		{
			x = Math.floor(v/2)%2;
			y = Math.floor((v+1)/2)%2;
			geometry.vertices.push( frustumPoints[x*2*pointsForDepth+y*pointsForDepth+z] );
		}
		var mtl = lineMaterial;
		if ( z == 0 )
		{
			mtl = nearLineMaterial;
		}
		else if ( z == pointsForDepth-1 )
		{
			mtl = farLineMaterial;
		}
		var line = new THREE.Line( geometry, mtl );
		sceneFrustum.add( line );
	}
}

function getWorldLocation( ndc, world )
{
	var view = new THREE.Vector4();
	view.copy(ndc);
	var invMatrix = new THREE.Matrix4();
	invMatrix.getInverse( camera.projectionMatrix );
	view.applyMatrix4( invMatrix );
	view.divideScalar(view.w);

	world.copy(view);
	world.applyMatrix4(camera.matrixWorld);
}

function setupGui() {
	effectController = {
		fov: 40,
		near: 10,
		far: 110,
		transx: 0,
		transy: 5,
		transz: 0,
		rotx: 0,
		roty: 0,
		rotz: 0,
		scale: 1,
		matrix: 'all',
		perm: true,
		viewport: 'off',
		grid: true,
		xgrid: false,
		zgrid: false,
		ndc: false,
		help: false
	};
	var gui = new dat.GUI();
	var element = gui.add( effectController, "matrix", [ 'model', 'view', 'projection', 'window', 'all' ] ).name("Watch matrix");
	
	var f1 = gui.addFolder('Model manipulation');
	f1.add( effectController, "transx", -10.0, 10.0 ).name("X translation");
	f1.add( effectController, "transy", -10.0, 10.0 ).name("Y translation");
	f1.add( effectController, "transz", -10.0, 10.0 ).name("Z translation");
	f1.add( effectController, "rotx", 0, 360.0 ).name("X rotation");
	f1.add( effectController, "roty", 0, 360.0 ).name("Y rotation");
	f1.add( effectController, "rotz", 0, 360.0 ).name("Z rotation");
	f1.add( effectController, "scale", 0.1, 2.0 ).name("Scale");
	
	var f2 = gui.addFolder('Camera manipulation');
	f2.add( effectController, "fov", 1.0, 179.0 ).name("Field of view");
	f2.add( effectController, "near", 1.0, 50.0 ).name("Near plane");
	f2.add( effectController, "far", 50.0, 150.0 ).name("Far plane");
	
	gui.add( effectController, "perm" ).name("Keep highlit");
	gui.add( effectController, "viewport", [ 'off', 'on', 'depths' ] ).name("Show frustum");
	gui.add( effectController, "grid" ).name("Show ground");
	gui.add( effectController, "xgrid" ).name("Show X grid");
	gui.add( effectController, "zgrid" ).name("Show Z grid");
	gui.add( effectController, "ndc" ).name("Show NDC");
	gui.add( effectController, "help" ).name("Help");
}

function render() 
{
	ambientLight.visible = false;
	light.visible = true;

	controls.update();
	cube.position.x = effectController.transx;
	cube.position.y = effectController.transy;
	cube.position.z = effectController.transz;
	cube.rotation.x = effectController.rotx * Math.PI/180;
	cube.rotation.y = effectController.roty * Math.PI/180;
	cube.rotation.z = effectController.rotz * Math.PI/180;
	cube.scale.set( effectController.scale, effectController.scale, effectController.scale );
	camera.fov = effectController.fov;
	camera.near = effectController.near;
	camera.far = effectController.far;
	camera.updateProjectionMatrix();
	light.position.copy(camera.position);
	var force = ( viewMode != effectController.matrix );
	viewMode = effectController.matrix;
	createText( force || !effectController.perm );
	
	// clear whole screen with proper clear color
	renderer.clear();
	renderer.render( scene, camera );
	if ( effectController.ndc )
		renderer.render( sceneGrid, cameraGrid );

	// show viewport
	if ( effectController.viewport != 'off' )
	{
		var viewSize = 100;
		corner.scale.set( 3,3,3 );
		setTextVisibility( false );
		ambientLight.visible = true;
		light.visible = false;

		var aspect = canvasWidth / canvasHeight;
		frustumCam = new THREE.OrthographicCamera(
				-aspect*viewSize / 2, aspect*viewSize / 2,
				viewSize / 2, -viewSize / 2,
				-0, 500 );
		var verticalOffset = 0;
		frustumCam.position.set( 250, verticalOffset, 0 );
		frustumTarget.set( 0, verticalOffset, 0 );

		//frustumCam.position.copy( camera.position );
		frustumCam.lookAt( frustumTarget );
		
		// rearview render
		renderer.enableScissorTest( true );
		// setScissor could be set just once in this particular case,
		// since it never changes, and then just enabled/disabled
		
		var viewsize = 0.45;
		var borderh = 4/canvasWidth;
		var borderv = 4/canvasHeight;
		var margin = 0.00;
		// background black
		renderer.setClearColorHex( 0x0, 1.0 );
		renderer.setScissor( (1.0-margin-viewsize-borderh) * canvasWidth, margin * canvasHeight,
			(viewsize+borderh) * canvasWidth, (viewsize+borderv) * canvasHeight );
		renderer.setViewport( (1.0-margin-viewsize-borderh) * canvasWidth, margin * canvasHeight,
			(viewsize+borderh) * canvasWidth, (viewsize+borderv) * canvasHeight );
		renderer.clear();

		renderer.setClearColorHex( clearColor, 1.0 );
		renderer.setScissor( (1.0-margin-viewsize-borderh/2) * canvasWidth, (margin + borderv/2) * canvasHeight,
			viewsize * canvasWidth, viewsize * canvasHeight );
		renderer.setViewport( (1.0-margin-viewsize-borderh/2) * canvasWidth, (margin + borderv/2) * canvasHeight,
			viewsize * canvasWidth, viewsize * canvasHeight );
		renderer.clear();
		renderer.render( scene, frustumCam );	

		// create frustum and display
		createFrustum( (effectController.viewport == 'on') ? 2 : 5 );
		renderer.render( sceneFrustum, frustumCam );
		
		// restore any state needed
		corner.scale.set( 1,1,1 );
		setTextVisibility( true );
		renderer.setViewport( 0, 0, canvasWidth, canvasHeight );
		renderer.enableScissorTest( false );
	}
	
	renderer.render( sceneText, camera );
}

setupGui();
init();
animate();
