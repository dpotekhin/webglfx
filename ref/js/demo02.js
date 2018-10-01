!function() {
	'use strict';


	// ---------------------------------------------------
	// >>> FRAGMENT SHADER >>> 
	// ---------------------------------------------------
	var frag_shader = `
		#define TWO_PI 6.2831853072
		#define PI 3.14159265359

		precision highp float;

		uniform float globaltime;
		uniform vec2 resolution;
		uniform vec2 center_position;
		uniform float aspect;
		uniform float scroll;
		uniform float velocity;
		uniform sampler2D texture;

		const float timescale = 0.1;
		const float twist = 2.0;

		vec2 rotate(vec2 v, float angle) {
			float c = cos(angle);
			float s = sin(angle);
			return v * mat2(c, -s, s, c);
		}

		float nsin(float value) {
			return sin(value * TWO_PI) * 0.5 + 0.5;
		}

		void main(void) {
			float time = globaltime * timescale;
			// vec2 center = vec2(sin(TWO_PI * time * 0.2), cos(TWO_PI * time * 0.2)) * nsin(time * 0.3) * 0.5;
			vec2 center = center_position;
			vec2 tx = (gl_FragCoord.xy / resolution.xy - 0.5 - center) * vec2(aspect, 1.0);
			float len = 1.0 - length(tx);
			float zoom = 1.0 + scroll - len * 3.0 * (1.0 - scroll) + len * velocity * 2.0;

			vec4 imgColor = texture2D(
				texture,
				rotate(
					(tx + center) * vec2(1.0, -1.0) * zoom,
					// time
					// center_position[0]*center_position[1]
					twist * TWO_PI * nsin(len + time) * scroll + time
				) + 0.5
			);

			gl_FragColor = imgColor;
		}
	`;
	// ---------------------------------------------------
	// <<< FRAGMENT SHADER <<< 
	// ---------------------------------------------------


	var canvas = document.querySelector('#webgl');

	// Scroll variables
	var scroll = 0.0, velocity = 0.0, lastScroll = 0.0;

	// Initialize REGL from a canvas element
	var regl = createREGL({
		canvas: canvas,
		onDone: function(error, regl) {
			if (error) { alert(error); }
		}
	});

	// Loading a texture
	var img = new Image();
	img.src = 'img/pam.jpg';
	// img.src = 'img/img2.jpg';
	// img.src = 'img/znak.png';
	img.onload = function() {

		setTimeout(function() { document.body.classList.remove('loading');}, 1000);

		// Create a REGL draw command
		var draw = regl({
			frag: frag_shader,
			vert: 'attribute vec2 position; void main() { gl_Position = vec4(3.0 * position, 0.0, 1.0); }',
			attributes: { position: [-1, 0, 0, -1, 1, 1] },
			count: 3,
			uniforms: {
				globaltime: regl.prop('globaltime'),
				resolution: regl.prop('resolution'),
				aspect: regl.prop('aspect'),
				scroll: regl.prop('scroll'),
				velocity: regl.prop('velocity'),
				texture: regl.texture(img),
				center_position: regl.prop('center_position'),
			}
		});

		var mx = 0;
		var my = 0;
		window.addEventListener('mousemove', function (e) {
			// console.log('move', e );
			mx += ((e.clientX / window.innerWidth - 0.5) - mx) / 8;
			my += ((1.0 - e.clientY / window.innerHeight - 0.5) - my) / 8;
		});

		// Hook a callback to execute each frame
		regl.frame(function(ctx) {

			// Resize a canvas element with the aspect ratio (100vw, 100vh)
			var aspect = canvas.scrollWidth / canvas.scrollHeight;
			canvas.width = 1024 * aspect;
			canvas.height = 1024;

			// Scroll amount (0.0 to 1.0)
			scroll = window.pageYOffset / (document.documentElement.scrollHeight - window.innerHeight);
			
			// Scroll Velocity
			// Inertia example:
			// velocity = velocity * 0.99 + (scroll - lastScroll);
			velocity = 0;
			lastScroll = scroll;

			// Clear the draw buffer
			regl.clear({ color: [255, 255, 255, 0] });

			// Execute a REGL draw command
			draw({
				globaltime: ctx.time,
				resolution: [ctx.viewportWidth, ctx.viewportHeight],
				aspect: aspect,
				scroll: scroll,
				velocity: velocity,
				center_position: [mx, my],
			});
		});

	};

}();