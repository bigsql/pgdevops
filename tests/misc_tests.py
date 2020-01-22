from base import Singleton, PGC_API, BaseTest
import requests
import logging

logger = logging.getLogger(__name__)

class MiscTests(BaseTest):
    def setUp(self):
        response = Singleton().response
        self.assertEqual(response['code'], 200)
        self.auth_token = response['authentication_token']

    def test_01_top(self):
        logger.info('top ...')
        headers = {
            "authentication_token": self.auth_token
        }
        response = requests.get(PGC_API + 'api/pgc/top', headers=headers)
        self.validate_response(response, "TOP")
        logger.info('TOP success')

    def test_01_lablist(self):
        logger.info('lablist ...')
        headers = {
            "authentication_token": self.auth_token
        }
        response = requests.get(PGC_API + 'api/pgc/lablist', headers=headers)
        self.validate_response(response, "LABLIST")
        logger.info('lablist success')

    def test_01_dblist(self):
        logger.info('dblist ...')
        headers = {
            "authentication_token": self.auth_token
        }
        response = requests.get(PGC_API + 'api/pgc/dblist pg', headers=headers)
        self.validate_response(response, "DBLIST")
        logger.info('dblist success')

    def test_01_dblist_vm_aws(self):
        logger.info('dblist vm aws ...')
        headers = {
            "authentication_token": self.auth_token
        }
        response = requests.get(PGC_API + 'api/pgc/dblist vm --cloud aws', headers=headers)
        self.validate_response(response, "DBLISTVMAWS")
        logger.info('dblist vm aws success')

    def test_01_dblist_vm_aws(self):
        logger.info('dblist vm azure ...')
        headers = {
            "authentication_token": self.auth_token
        }
        response = requests.get(PGC_API + 'api/pgc/dblist vm --cloud azure', headers=headers)
        self.validate_response(response, "DBLISTVMAZURE")
        logger.info('dblist vm azure success')



