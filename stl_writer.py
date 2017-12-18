"""
Author: Madelyn Olson
Created on Dec 17, 2017
Content: TODO
"""
import array
import math
import logging

class STLWriter(object):
    """
    TODO: Fill this in
    """
    def __init__(self, output_location, triangle_count):
        self.output_fp = open(output_location, 'w')
        self._write_header(triangle_count)

    def _write_header(self, triangle_count):
        # write the header, 80 0s followed by the number of triangles
        self.output_fp.write(b'\0' * 80)
        triangle_header_bytes = array.array('I', [triangle_count])
        triangle_header_bytes.tofile(self.output_fp)

    #Vector operation used for computing the normal vector
    def _vector_subtract(self, vector_1, vector_2):
        return [vector_1[0]-vector_2[0], vector_1[1]-vector_2[1], vector_1[2]-vector_2[2]]

    #Computes the crossProduct of two vectors, which is he normal of a triangle
    def _vector_normal(self, vector_1, vector_2):
        vector_x = vector_1[1]*vector_2[2] - vector_1[2]*vector_2[1]
        vector_y = vector_1[2]*vector_2[0] - vector_1[0]*vector_2[2]
        vector_z = vector_1[0]*vector_2[1] - vector_1[1]*vector_2[0]
        unit_magnitude = 1/(math.sqrt(vector_x**2 + vector_y**2 + vector_z**2))
        return [vector_x*unit_magnitude, vector_y*unit_magnitude, vector_z*unit_magnitude]

    def write_triangle(self, point_1, point_2, point_3, inverted=False):
        """
        TODO: Fill this in
        """
        logging.debug('Writing triangle with points {}, {}, {}'.format(str(point_1),
            str(point_2),
            str(point_3)))
        if inverted:
            temp = point_3
            point_3 = point_2
            point_2 = temp
        normal_vector = self._vector_normal(self._vector_subtract(point_3, point_1), 
            self._vector_subtract(point_2, point_1))

        for vector in [normal_vector, point_1, point_2, point_3]:
            vector_bytes = array.array('f', vector)
            vector_bytes.tofile(self.output_fp)

        triangle_attributes_bytes = array.array('B', [0, 0])
        triangle_attributes_bytes.tofile(self.output_fp)