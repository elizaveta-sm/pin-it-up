import { Flex, Spin } from 'antd';

const contentStyle = {
    borderRadius: 4,
};

const Spinner = () => {
    const content = <div style={contentStyle} />;

    return (
        <Flex gap="small" vertical className='p-10'>
            <Spin tip="Loading..." size="large">
                {content}
            </Spin>
        </Flex>
    );
}

export default Spinner