import argparse
import array
import logging
import time

from julia_generator import JuliaGridGenerator
from stl_writer import STLWriter

def format_fractal_map_for_stl(fractal_map, window_width, window_height, vertical_scale, type):
    formatted_data_map = []
    for i in range(window_width + 1):
        row_map = []
        for j in range(window_height + 1):
            if type == 'extrude':
                row_map.append([float(i - window_width/2), 
                    float(j - window_height/2), 
                    fractal_map[i][j]*vertical_scale])
            elif type == 'inset':
                row_map.append([float(i - window_width/2), 
                    float(j - window_height/2), 
                    -fractal_map[i][j]*vertical_scale])
        formatted_data_map.append(row_map)
    return formatted_data_map

def __find_largest_square(data, i, j, max_size):
    if max_size == 1:
        return 1
    for new_size in range(1, max_size + 1):
        for x in range(new_size + 1):
            if (data[i][j][2] != data[i + new_size][j + x][2]) or (data[i][j][2] != data[i + x][j + new_size][2]):
                return max(new_size - 1, 1)
    return max_size

def test():
    for i in range(2,6):
        print(__find_largest_square([[[1,1,1]] * i]*i, 0, 0, i - 1, i - 1))


def __write_surface_triangles(stl_writer, data, grid_width, grid_height):
    expected_triangles = grid_height * grid_width * 2
    triangles = 0
    # Write the surface triangles
    square_covered = array.array('b', [0] * (grid_width * grid_height))
    logging.info("Starting to write surface triangles")
    for i in range(grid_width):
        for j in range(grid_height):
            if square_covered[(grid_height)*i + j] == 1:
                continue
            
            max_allowed = min(grid_width - i, grid_height - j)
            square_size = __find_largest_square(data, i, j, max_allowed)
            points = [data[i][j], 
                data[i + square_size][j], 
                data[i][j + square_size], 
                data[i + square_size][j + square_size]]

            if square_size != 1:
                logging.debug('Found optimized square of size {} ({}, {})'.format(square_size, i, j))

            # If there are four points:
            # 0 1
            # 2 3
            # Render two triangles two triangles: 
            # 0 1     1
            # 2     2 3
            stl_writer.write_triangle(points[0], points[1], points[2])
            stl_writer.write_triangle(points[1], points[3], points[2])

            triangles += 2
            for x in range(i, i + square_size):
                for y in range(j, j + square_size):
                    square_covered[(grid_height)*x + y] = 1

    logging.info("Finished writing surface triangles ({} ({:.2f}%) saved)".format(expected_triangles - triangles, 100 * (1 - triangles/expected_triangles)))

def generate_stl_from_map(data, output_location, floor_value = -1.0, x_center = 0.0, y_center = 0.0):
    grid_width = len(data) - 1
    grid_height = len(data[0]) - 1

    # Number of triangles is equal to:
    # width * height * 2 triangles for surface
    # width * 6 + height * 6 for edges
    # Write out number of triangles as an int
    triangle_count = 0
    triangle_count += grid_width*grid_height*2
    triangle_count += grid_width*6 + grid_height*6

    stl_writer = STLWriter(output_location, triangle_count)

    start_time = time.time()
    
    logging.info("Preparing to write {} triangles".format(triangle_count))
    __write_surface_triangles(stl_writer, data, grid_width, grid_height)

    # Point used for writing the bottom
    center_point = [x_center, y_center, floor_value]

    # Writing edges along parellel to the x dimension
    logging.info("Starting to write edge and base triangles along x edge dimension")
    for i in range(grid_width - 1):
        for j, inverted in [0, True], [grid_height, False]:
            point_1_value = data[i][j]
            point_2_value = data[i + 1][j]
            point_1_floor = [data[i][j][0], data[i][j][1], floor_value]
            point_2_floor = [data[i + 1][j][0], data[i + 1][j][1], floor_value]
            
            stl_writer.write_triangle(point_1_value, point_2_value, point_1_floor, inverted)
            stl_writer.write_triangle(point_2_value, point_2_floor, point_1_floor, inverted)
            stl_writer.write_triangle(point_1_floor, point_2_floor, center_point, inverted)
    logging.info("Finished writing edge and base triangles along x edge dimension")

    # Writing edges along parelle to the y dimension
    logging.info("Starting to write edge and base triangles along y edge dimension")
    for j in range(grid_height):
        for i, inverted in [0, False], [grid_width - 1, True]:
            point_1_value = data[i][j]
            point_2_value = data[i][j + 1]
            point_1_floor = [data[i][j][0], data[i][j][1], floor_value]
            point_2_floor = [data[i][j + 1][0], data[i][j + 1][1], floor_value]

            stl_writer.write_triangle(point_1_value, point_2_value, point_1_floor, inverted)
            stl_writer.write_triangle(point_2_value, point_2_floor, point_1_floor, inverted)
            stl_writer.write_triangle(point_1_floor, point_2_floor, center_point, inverted)
    logging.info("Finished writing edge and base triangles along y edge dimension")
    elapsed_time = time.time() - start_time
    logging.info("Finished generating fractal stl in {} msecs.".format(round(1000*elapsed_time)))

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--debug', action='store_true', default=False, help='Print debug information')
    parser.add_argument('--quiet', action='store_true', default=False, help='Supress all logs except errors')
    parser.add_argument('--output-location', required=True)

    parser.add_argument('--type', choices=['extrude', 'inset'], default='extrude', help='Type of STL file to be generated')

    parser.add_argument('--window-width', 
        type=int, 
        default=300, 
        help='Input the type of fractal to output')
    parser.add_argument('--window-height', 
        type=int, 
        default=300, 
        help='Input the type of fractal to output')

    parser.add_argument('-ji',
        '--julia-constant-imaginary', 
        type=float, 
        default = -0.70)
    parser.add_argument('-jr',
        '--julia-constant-real', 
        type=float, 
        default = -0.21)

    parser.add_argument('--vertical-scale', 
        type=float, 
        default=0.1)
    parser.add_argument('--base-height', 
        type=float, 
        default=1)
    parser.add_argument('--iterations', 
        type=int, 
        default=40)
    parser.add_argument('--iteration-floor', 
        type=int, 
        default=0)

    args = parser.parse_args()
    if args.debug:
        level = logging.DEBUG
    elif args.quiet:
        level = logging.WARN
    else:
        level = logging.INFO
    
    logging.basicConfig(format='%(levelname)s:%(message)s', level=level)
    
    grid_generator = JuliaGridGenerator(-1, 1, -1, 1)
    fractal_data = grid_generator.compute_julia_map(args.window_width, 
        args.window_height, 
        args.julia_constant_imaginary, 
        args.julia_constant_real, 
        args.iterations,
        args.iteration_floor)

    formatted_data = format_fractal_map_for_stl(fractal_data,
        args.window_width,
        args.window_height,
        args.vertical_scale,
        args.type)
    logging.info("Finished formatting fractal data")

    # Finally, generate the stl from the map
    generate_stl_from_map(formatted_data, 
        args.output_location, 
        floor_value=-args.base_height)

if __name__ == "__main__":
    main()
