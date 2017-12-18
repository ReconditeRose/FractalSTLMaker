"""
Author: Madelyn Olson
Created on Dec 17, 2017
Content: TODO
"""
import argparse
import logging

from julia_generator import JuliaGridGenerator
from stl_writer import STLWriter

def format_fractal_map_for_stl(fractal_map, window_width, window_height, vertical_scale):
    """
    TODO: Fill this out
    """
    formatted_data_map = []
    for i in range(window_width):
        row_map = []
        for j in range(window_height):
            row_map.append([float(i - window_width/2), 
                float(j - window_height/2), 
                fractal_map[i][j]*vertical_scale])
        formatted_data_map.append(row_map)
    return formatted_data_map

def generate_stl_from_map(data, output_location, floor_value = -1.0, x_center = 0.0, y_center = 0.0):
    """
    TODO: Fill this out
    """

    grid_width = len(data)
    grid_height = len(data[0])

    # Number of triangles is equal to:
    # width * height * 2 triangles for surface
    # width * 6 + height * 6 for edges
    # Write out number of triangles as an int
    triangle_count = 0
    triangle_count += (grid_width - 1)*(grid_height - 1)*2
    triangle_count += (grid_width - 1)*6 + (grid_height - 1)*6

    stl_writer = STLWriter(output_location, triangle_count)

    logging.info("Preparing to write {} triangles to {}".format(triangle_count, output_location))

    # Write the surface triangles
    logging.info("Starting to write surface triangles")
    for i in range(grid_width - 1):
        for j in range(grid_height - 1):
            point_1 = data[i][j]
            point_2 = data[i + 1][j]
            point_3 = data[i][j + 1]
            point_4 = data[i + 1][j + 1]

            stl_writer.write_triangle(point_1, point_3, point_2)
            stl_writer.write_triangle(point_2, point_3, point_4)
    logging.info("Finished writing surface triangles")

    # Point used for writing the bottom
    center_point = [x_center, y_center, floor_value]

    # Writing edges along parelle to the x dimension
    logging.info("Starting to write edge and base triangles along x edge dimension")
    for i in range(grid_width - 1):
        for j, inverted in [0, False], [grid_height - 1, True]:
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
    for j in range(grid_height - 1):
        for i, inverted in [0, True], [grid_width - 1, False]:
            point_1_value = data[i][j]
            point_2_value = data[i][j + 1]
            point_1_floor = [data[i][j][0], data[i][j][1], floor_value]
            point_2_floor = [data[i][j + 1][0], data[i][j + 1][1], floor_value]

            stl_writer.write_triangle(point_1_value, point_2_value, point_1_floor, inverted)
            stl_writer.write_triangle(point_2_value, point_2_floor, point_1_floor, inverted)
            stl_writer.write_triangle(point_1_floor, point_2_floor, center_point, inverted)
    logging.info("Finished writing edge and base triangles along y edge dimension")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--debug', action='store_true', default=False, help='Print debug information')
    parser.add_argument('--output-location', required=True)

    parser.add_argument('--window-width', 
        type=int, 
        default=300, 
        help='Input the type of fractal to output')
    parser.add_argument('--window-height', 
        type=int, 
        default=300, 
        help='Input the type of fractal to output')

    parser.add_argument('--julia-constant-imaginary', 
        type=float, 
        default = -0.70)
    parser.add_argument('--julia-constant-real', 
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

    args = parser.parse_args()
    if args.debug:
        logging.basicConfig(format='%(levelname)s:%(message)s', level=logging.DEBUG)
    else:
        logging.basicConfig(format='%(levelname)s:%(message)s', level=logging.INFO)

    grid_generator = JuliaGridGenerator(-1, 1, -1, 1)
    fractal_data = grid_generator.compute_julia_map(args.window_width, 
        args.window_height, 
        args.julia_constant_imaginary, 
        args.julia_constant_real, 
        args.iterations)

    formatted_data = format_fractal_map_for_stl(fractal_data,
        args.window_width,
        args.window_height,
        args.vertical_scale)
    logging.info("Finished formatting fractal data")
    # Finally, generate the stl from the map
    generate_stl_from_map(formatted_data, 
        args.output_location, 
        floor_value=-args.base_height)


if __name__ == "__main__":
    main()
