varying vec3 vUv;
uniform float u_time;
uniform float rad;
uniform vec2 u_resolution;
uniform int u_circles; // 12
uniform float u_size;  // 0.04
uniform float u_volume;
// float u_volume = 1.0;

#define PI 3.14159265359

float GLOW = max(0.1, u_volume / 2.);
const int POINTS = 20;
int ACTUAL_POINTS = 16;//16;



vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
vec2 fade(vec2 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}

float cpnoise(vec2 P){
  vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
  vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
  Pi = mod(Pi, 289.0); // To avoid truncation effects in permutation
  vec4 ix = Pi.xzxz;
  vec4 iy = Pi.yyww;
  vec4 fx = Pf.xzxz;
  vec4 fy = Pf.yyww;
  vec4 i = permute(permute(ix) + iy);
  vec4 gx = 2.0 * fract(i * 0.0243902439) - 1.0; // 1/41 = 0.024...
  vec4 gy = abs(gx) - 0.5;
  vec4 tx = floor(gx + 0.5);
  gx = gx - tx;
  vec2 g00 = vec2(gx.x,gy.x);
  vec2 g10 = vec2(gx.y,gy.y);
  vec2 g01 = vec2(gx.z,gy.z);
  vec2 g11 = vec2(gx.w,gy.w);
  vec4 norm = 1.79284291400159 - 0.85373472095314 *
    vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11));
  g00 *= norm.x;
  g01 *= norm.y;
  g10 *= norm.z;
  g11 *= norm.w;
  float n00 = dot(g00, vec2(fx.x, fy.x));
  float n10 = dot(g10, vec2(fx.y, fy.y));
  float n01 = dot(g01, vec2(fx.z, fy.z));
  float n11 = dot(g11, vec2(fx.w, fy.w));
  vec2 fade_xy = fade(Pf.xy);
  vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
  float n_xy = mix(n_x.x, n_x.y, fade_xy.y);
  return 2.3 * n_xy;
}

mat2 rotate2d(float angle) {
    return mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
}

#define NUM_OCTAVES 5

float rand(vec2 n) {
	return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

float noise(vec2 p){
	vec2 ip = floor(p);
	vec2 u = fract(p);
	u = u*u*(3.0-2.0*u);

	float res = mix(
		mix(rand(ip),rand(ip+vec2(1.0,0.0)),u.x),
		mix(rand(ip+vec2(0.0,1.0)),rand(ip+vec2(1.0,1.0)),u.x),u.y);
	return res*res;
}

float fbnoise(vec2 x) {
	float v = 0.0;
	float a = 0.7;
	vec2 shift = vec2(100);
	// Rotate to reduce axial bias
    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));
	for (int i = 0; i < NUM_OCTAVES; ++i) {
		v += a * noise(x);
		x = rot * x * 2.0 + shift;
		a *= 0.5;
	}
	return v;
}

const mat2 m2 = mat2(0.8,-0.6,0.6,0.8);
float fbnoise2( in vec2 p ){
    float f = 0.0;
    f += 0.5000*noise( p ); p = m2*p*2.02;
    f += 0.2500*noise( p ); p = m2*p*2.03;
    f += 0.1250*noise( p ); p = m2*p*2.01;
    f += 0.0625*noise( p );

    return f/0.9375;
}

vec3 getPoint(vec2 uv, float radius, vec2 center, int index) {
    float dist = radius / distance(uv, center);
    float c = pow(dist, 1.0/GLOW);

    float r = noise(vec2(u_time, float(index + POINTS) + 0.5));// 0.6;
    float g = noise(vec2(u_time, float(index + POINTS) + 1.5)); //0.4;
    float b = noise(vec2(u_time, float(index + POINTS) + 2.5));//0.4;

    // float r = sin(float(index) + u_time); //0.6;
    // float g = 1.0 - cos(float(index) + u_time);// 0.4;
    // float b = sin(float(index) + u_time * u_volume / 2.);

    // float r = 0.6;
    // float g = 0.4;
    // float b = 0.4;

    vec3 color = vec3(r, g, b);
    // color = vec3(rotate2d(pow(uv.y*3.,13.)) * vec2(0.6,0.4),0.4);
    return vec3(c) * color;
}

void main() {
    vec2 uv = vUv.xy / u_resolution;
    uv.x *= u_resolution.x / u_resolution.y;

    float radius = .02;
    vec3 color = vec3(0.,0.,0.);

    // uv = rotate2d(PI / 8. * u_volume) * uv;

    uv = rotate2d(2. * PI * cpnoise(vec2(u_time  / 2.5, 5234.2))) * uv;

    // uv = rotate2d(u_volume / 2. * 2. * PI);

    // uv = rotate2d(sin(u_time + sin(u_time + u_volume)) * PI) * uv;


    float scale = 0.4 + pow(u_volume / 2., 3.) * 0.2;

    float speed = max(0.5, pow((2.0 + u_volume), 2.) / 32.);


    for (int i = 0 ; i < POINTS ; ++i) {

        if (i >= ACTUAL_POINTS) {
            break;
        }

        if (i == 8) {
            uv = rotate2d(PI/2.) * uv;
        }

        radius = noise(vec2(u_time, 567.5 + float(i*2))) * 0.05;

        float px = 0.;

        float range = float(i + 1) * 0.05;

        if (fract(float(i)/2.) > 0.) {
            px = cos(PI + u_time * speed) * range;
            // px = 1.4 - fract(u_time * speed) * 1.4 - 0.7; //sin(u_time) * 0.65;
        } else {
            px = cos(u_time * speed) * range;
            // px = fract(u_time * speed) * 1.4 - 0.7; //sin(u_time) * 0.65;
        }

        // px += noise(vec2(float(i*3 + 200), u_time)) * (u_volume / 8.);

        float py = cpnoise(vec2(float(i*2 + 100) + u_time + 0.5, float(i*2 + 100) + 0.5)) * scale;

        color = color + getPoint(uv, radius, vec2(px, py), i);
    }


    gl_FragColor = vec4(color * vec3(u_volume / 2.), 1.0);


}